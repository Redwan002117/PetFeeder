import { initializeApp, FirebaseApp, getApp } from 'firebase/app';
import { 
  getAuth, 
  getDatabase, 
  getStorage, 
  getMessaging
} from './firebase-imports';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword,
  updateProfile,
  applyActionCode,
  setPersistence,
  browserLocalPersistence,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  deleteUser,
  connectAuthEmulator
} from "firebase/auth";
import { 
  ref, 
  set, 
  onValue, 
  off, 
  push, 
  update, 
  remove,
  get,
  serverTimestamp,
  connectDatabaseEmulator,
  Database
} from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  connectStorageEmulator
} from "firebase/storage";
import { getToken, onMessage } from "firebase/messaging";
import firebaseConfig from "./firebase-config";
import { throttle } from 'lodash';
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { 
  safeRef, 
  safeSet, 
  safeUpdate, 
  safeGet, 
  safeOnValue, 
  safePush, 
  safeRemove, 
  safeServerTimestamp 
} from './firebase-utils';

// Environment detection
const isDevelopment = import.meta.env.DEV === true;
// Determine if we should use emulators (only in development and if explicitly enabled)
const useEmulators = isDevelopment && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

// Simplified ad blocker detection
let adBlockerDetected = false;

// We'll set this to true by default to be safe
// This way, if there are any issues with detection, we'll use the fallback methods
setTimeout(() => {
  try {
    // Create a bait element that ad blockers typically target
    const bait = document.createElement('div');
    bait.className = 'ad-banner';
    bait.style.cssText = 'position: absolute; left: -999px; top: -999px; height: 1px; width: 1px;';
    document.body.appendChild(bait);
    
    // Check if the bait was hidden or removed by an ad blocker
    adBlockerDetected = bait.offsetHeight === 0 || bait.offsetParent === null;
    
    // Clean up
    if (document.body.contains(bait)) {
      document.body.removeChild(bait);
    }
    
    if (adBlockerDetected) {
      console.log('Ad blocker detected, using fallback methods');
    }
  } catch (error) {
    console.log('Error in ad blocker detection, assuming it is active');
    adBlockerDetected = true;
  }
}, 500); // Delay to ensure the DOM is ready

// Initialize Firebase app immediately to avoid "No Firebase App '[DEFAULT]' has been created" error
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully on initial load');
} catch (error) {
  console.error('Error initializing Firebase app on initial load:', error);
  // If there's an error, it might be because the app is already initialized
  try {
    app = getApp();
    console.log('Retrieved existing Firebase app');
  } catch (getAppError) {
    console.error('Could not retrieve existing Firebase app:', getAppError);
  }
}

// Initialize Firebase
let auth = null;
let database = null;
let firestore = null;
let storage = null;
let messaging = null;
let googleProvider = null;

// Flag to track initialization status
let isInitialized = false;

// Create a mock database reference
const createMockRef = (path: string) => {
  return {
    key: path.split('/').pop(),
    path: path,
    parent: null,
    root: null,
    _checkNotDeleted: () => true,
    toString: () => path
  };
};

// Create a fixed admin account for development and testing
const createFixedAdminAccount = async () => {
  if (!auth || !database || typeof database.ref !== 'function') {
    console.error('Auth or database not initialized properly');
    return;
  }

  try {
    // Check if admin exists in database
    const adminRef = safeRef('users/admin123');
    if (!adminRef) {
      console.error('Error checking admin in database: adminRef is null');
      return;
    }

    const adminSnapshot = await safeGet('users/admin123');

    if (adminSnapshot && adminSnapshot.exists()) {
      console.log('Admin account exists');
      return;
    }

    // Create admin account in database if it doesn't exist
    await safeSet('users/admin123', {
      email: 'admin@example.com',
      displayName: 'Admin User',
      role: 'admin',
      createdAt: Date.now()
    });

    console.log('Fixed admin account created successfully');
  } catch (error) {
    console.error('Error checking admin in database:', error);
  }
};

// Initialize Firebase and services
function initializeFirebase() {
  if (isInitialized) return;
  
  try {
    console.log('Initializing Firebase with config:', { ...firebaseConfig, apiKey: '***REDACTED***' });
    
    // Check if databaseURL is provided
    if (!firebaseConfig.databaseURL) {
      console.error('Firebase database URL is not configured. Database features will not work.');
    }
    
    // Initialize Firebase app if not already initialized
    if (!app) {
      try {
        app = initializeApp(firebaseConfig);
        console.log('Firebase app initialized successfully');
      } catch (initError) {
        console.error('Error initializing Firebase app:', initError);
        // Try to get the existing app
        try {
          app = getApp();
          console.log('Retrieved existing Firebase app');
        } catch (getAppError) {
          console.error('Could not retrieve existing Firebase app:', getAppError);
          throw initError; // Re-throw the original error if we can't get an existing app
        }
      }
    }
    
    // Initialize Firebase services
    if (!auth) {
      try {
        auth = getAuth(app);
        console.log('Firebase auth initialized successfully');
        
        // Set persistence to LOCAL to keep the user logged in
        setPersistence(auth, browserLocalPersistence)
          .then(() => console.log('Firebase persistence set to LOCAL'))
          .catch(error => console.error('Error setting persistence:', error));
      } catch (authError) {
        console.error('Error initializing Firebase auth:', authError);
      }
    }
    
    // Initialize database if URL is provided
    if (firebaseConfig.databaseURL && !database) {
      try {
        // First try with default app
        database = getDatabase(app);
        console.log('Firebase database initialized successfully');
      } catch (dbError) {
        console.error('Error initializing Firebase database:', dbError);
        
        try {
          // Try with explicit app and URL
          database = getDatabase(app, firebaseConfig.databaseURL);
          console.log('Firebase database initialized with explicit URL');
        } catch (explicitDbError) {
          console.error('Error initializing Firebase database with explicit URL:', explicitDbError);
          
          // Create a more complete mock database for offline functionality
          console.log('Creating mock database for offline functionality');
          database = {
            _mockData: {},
            _listeners: {},
            app: app,
            
            // Implement required methods
            ref: (path: string) => createMockRef(path),
            
            // Add _checkNotDeleted method to the database object itself
            _checkNotDeleted: () => true
          };
        }
      }
    }
    
    // Initialize Firestore
    if (!firestore) {
      try {
        firestore = getFirestore(app);
        console.log('Firebase Firestore initialized successfully');
      } catch (firestoreError) {
        console.error('Error initializing Firestore:', firestoreError);
        firestore = null;
      }
    }
    
    // Initialize Storage
    if (!storage) {
      try {
        storage = getStorage(app);
        console.log('Firebase Storage initialized successfully');
      } catch (storageError) {
        console.error('Error initializing Storage:', storageError);
        
        // Create a mock storage for offline functionality
        console.log('Creating mock storage for offline functionality');
        storage = {
          _mockData: {},
          ref: (path: string) => ({
            path: path,
            put: async (file: File) => ({
              ref: { getDownloadURL: async () => `mock-url-for-${file.name}` },
              metadata: { name: file.name, contentType: file.type }
            }),
            getDownloadURL: async () => `mock-url-for-${path}`,
            _checkNotDeleted: () => true
          })
        };
      }
    }
    
    // Initialize Google provider
    if (!googleProvider) {
      googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: 'select_account' });
    }
    
    // Connect to emulators only in development mode and if explicitly enabled
    if (useEmulators) {
      try {
        // Check if we're running in a browser environment
        if (typeof window !== 'undefined') {
          console.log('Connecting to Firebase emulators...');
          
          // Connect to auth emulator
          if (auth) {
            connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: false });
          }
          
          // Connect to database emulator
          if (database && typeof database.ref === 'function') {
            connectDatabaseEmulator(database, "localhost", 9000);
          }
          
          // Connect to firestore emulator
          if (firestore) {
            connectFirestoreEmulator(firestore, "localhost", 8080);
          }
          
          // Connect to storage emulator
          if (storage && typeof storage.ref === 'function') {
            connectStorageEmulator(storage, "localhost", 9199);
          }
          
          console.log("Connected to Firebase emulators");
        }
      } catch (error) {
        console.error("Error connecting to Firebase emulators:", error);
      }
    }
    
    isInitialized = true;
    console.log('Firebase initialization complete');
    
    // Create fixed admin account after initialization
    if (database && typeof database.ref === 'function') {
      try {
        createFixedAdminAccount();
      } catch (error) {
        console.error('Error creating fixed admin account:', error);
      }
    }
    
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    isInitialized = false;
  }
}

// Initialize Firebase immediately
initializeFirebase();

// Add this rate limiting utility
const rateLimits = {};
const RATE_LIMIT_RESET_MS = 60000; // 1 minute

// Check if a function call should be rate limited
function checkLimit(key, limit = 10) {
  const now = Date.now();
  
  // Initialize or reset expired rate limit
  if (!rateLimits[key] || now - rateLimits[key].timestamp > RATE_LIMIT_RESET_MS) {
    rateLimits[key] = {
      count: 1,
      timestamp: now
    };
    return true;
  }
  
  // Increment count and check if limit is reached
  rateLimits[key].count++;
  return rateLimits[key].count <= limit;
}

// Authentication helper functions
export const signIn = async (emailOrUsername: string, password: string) => {
  try {
    // Check if input is an email (contains @)
    const isEmail = emailOrUsername.includes('@');
    
    if (isEmail) {
      // If it's an email, use regular email/password sign in
      const userCredential = await signInWithEmailAndPassword(auth, emailOrUsername, password);
      return userCredential.user;
    } else {
      // If it's a username, we need to find the corresponding email
      const usersRef = ref(database, 'users');
      const usersSnapshot = await get(usersRef);
      
      if (usersSnapshot.exists()) {
        let userEmail = null;
        let foundUser = false;
        
        // Iterate through users to find the one with matching username
        usersSnapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.displayName === emailOrUsername) {
            userEmail = userData.email;
            foundUser = true;
            return true; // Break the forEach loop
          }
        });
        
        if (foundUser && userEmail) {
          // Sign in with the found email
          const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
          return userCredential.user;
        } else {
          throw new Error("Username not found. Please check your credentials.");
        }
      } else {
        throw new Error("No users found in the database.");
      }
    }
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Add a function to get the Google auth provider without signing in
export const getGoogleAuthProvider = () => {
  // Create a new instance each time to avoid issues with reusing the same provider
  const provider = new GoogleAuthProvider();
  
  // Configure the provider with minimal parameters to avoid ad blocker issues
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  return provider;
};

// Update the signInWithGoogle function to avoid loops
export const signInWithGoogle = async (isSignup?: boolean) => {
  try {
    // Clear any previous auth state to prevent loops
    localStorage.removeItem('authMode');
    
    // Store auth mode in session storage for redirect handling
    if (isSignup) {
      localStorage.setItem('authMode', 'signup');
    } else {
      localStorage.setItem('authMode', 'signin');
    }

    // Get a fresh provider instance
    const provider = getGoogleAuthProvider();

    // Use signInWithPopup for immediate feedback
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Successfully signed in with popup:", user);

      // Process the user
      await processGoogleUser(user);
      
      // Clear auth mode after successful sign-in
      localStorage.removeItem('authMode');
      
      return { 
        success: true, 
        user 
      };
    } catch (popupError) {
      console.error("Popup sign-in failed, trying redirect:", popupError);
      
      // If popup fails (e.g., blocked by browser), fall back to redirect
      await signInWithRedirect(auth, provider);
      return { 
        success: true, 
        redirect: true 
      };
    }
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    
    // Clear auth mode on error
    localStorage.removeItem('authMode');
    
    return { 
      success: false, 
      error: error.message || "Authentication failed. Please try again." 
    };
  }
};

// Helper function to process Google user
const processGoogleUser = async (user: User) => {
  if (!user) return;
  
  try {
    // Check if user already exists in database
    const userData = await safeGet(`users/${user.uid}`);
    
    if (!userData || !userData.exists()) {
      // Create new user data
      const newUser = {
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: Date.now(),
        lastLogin: Date.now(),
        role: 'user', // Always set new users as regular users
        permissions: {
          canFeed: true,
          canSchedule: true,
          canViewStats: true
        }
      };
      
      // Save user data to database
      await safeSet(`users/${user.uid}`, newUser);
      console.log('New user created in database:', user.uid);
    } else {
      // Update last login
      await safeUpdate(`users/${user.uid}`, {
        lastLogin: Date.now(),
        // Ensure role is set to 'user' unless explicitly marked as admin in the database
        role: userData.val().role === 'admin' ? 'admin' : 'user'
      });
      console.log('Existing user updated in database:', user.uid);
    }
  } catch (error) {
    console.error('Error processing Google user:', error);
  }
};

// Add a function to handle the redirect result
export const handleRedirectResult = async () => {
  console.log('Checking for redirect result...');
  try {
    const result = await getRedirectResult(auth);

    if (result && result.user) {
      console.log('Redirect result found:', result);
      
      // Process the user
      await processGoogleUser(result.user);
      
      // Clear auth mode after successful sign-in
      localStorage.removeItem('authMode');
      
      return { 
        success: true, 
        user: result.user 
      };
    }
    
    return { success: false, noResult: true };
  } catch (error: any) {
    console.error('Error handling redirect result:', error);
    
    // Clear auth mode on error
    localStorage.removeItem('authMode');
    
    return { 
      success: false, 
      error: error.message || 'Failed to complete authentication.' 
    };
  }
};

export const registerUser = async (email: string, password: string, name: string, username: string) => {
  try {
    console.log("Starting user registration process for:", email);
    
    // Check if username is already taken
    const usersRef = ref(database, 'users');
    console.log("Checking if username is already taken:", username);
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      let usernameTaken = false;
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.displayName === username) {
          usernameTaken = true;
          return true; // Break the forEach loop
        }
      });
      
      if (usernameTaken) {
        console.log("Username is already taken:", username);
        throw new Error("Username is already taken. Please choose a different username.");
      }
    }
    
    // Create user with email and password
    console.log("Creating user with email and password");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User created successfully:", user.uid);
    
    // Update user profile with the provided username
    console.log("Updating user profile with username:", username);
    await updateProfile(user, {
      displayName: username
    });
    
    // Send email verification
    console.log("Sending email verification");
    await sendEmailVerification(user);
    
    // Create user data with role in the database
    const userData = {
      email: email,
      displayName: username,
      name: name,
      role: 'user',
      permissions: {
        canFeed: true,
        canSchedule: true,
        canViewStats: true,
      },
      createdAt: serverTimestamp(),
      provider: 'email'
    };
    
    // Save user data to database
    console.log("Saving user data to database for user:", user.uid);
    await set(ref(database, `users/${user.uid}`), userData);
    console.log("User registration completed successfully");
    
    return userCredential;
  } catch (error: any) {
    console.error("Error registering user:", error);
    
    // Provide more user-friendly error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("This email is already registered. Please use a different email or try signing in.");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("The email address is not valid. Please enter a valid email.");
    } else if (error.code === 'auth/weak-password') {
      throw new Error("Password is too weak. Please use a stronger password.");
    }
    
    throw error;
  }
};

// Database functions
export const setData = async (path: string, data: any) => {
  return safeSet(path, data);
};

export const updateData = async (path: string, data: any) => {
  return safeUpdate(path, data);
};

export const getData = async (path: string) => {
  return safeGet(path);
};

export const getUserData = async (userId: string) => {
  return safeGet(`users/${userId}`);
};

export const removeData = async (path: string) => {
  return safeRemove(path);
};

export const getAllUsers = (callback: (users: any) => void) => {
  return safeOnValue('users', (snapshot: any) => {
    const users = snapshot.val() || {};
    callback(users);
  });
};

export const updateUserPermissions = (userId: string, permissions: any) => {
  return safeUpdate(`users/${userId}/permissions`, permissions);
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const updatePassword = async (user: User, currentPassword: string, newPassword: string) => {
  const credential = EmailAuthProvider.credential(user.email!, currentPassword);
  await reauthenticateWithCredential(user, credential);
  return firebaseUpdatePassword(user, newPassword);
};

export const updateUserProfile = async (user: User, profileData: { displayName?: string, photoURL?: string }) => {
  return updateProfile(user, profileData);
};

// Storage helper functions
export const uploadProfilePicture = async (userId: string, file: File) => {
  // Throw an error since Firebase Storage is not available
  throw new Error("Profile picture uploads are not available. Firebase Storage is not configured.");
  
  // The original implementation is commented out below for reference
  /*
  try {
    // Create a reference to the file location in Firebase Storage
    const profilePicRef = storageRef(storage, `users/${userId}/profilePicture`);
    
    // Upload the file
    const snapshot = await uploadBytes(profilePicRef, file);
    console.log('Uploaded profile picture successfully');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(profilePicRef);
    
    // Also update the user's photoURL in their profile data
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, { photoURL: downloadURL });
    
    // Clear any CORS issue flags since we successfully uploaded
    sessionStorage.removeItem('firebase_storage_cors_issue');
    
    return downloadURL;
  } catch (error: any) {
    console.error("Error uploading profile picture:", error);
    
    // Check if it's a CORS error
    if (error.code === 'storage/cors-error' || 
        error.message?.includes('CORS') || 
        error.message?.includes('network error')) {
      
      // Set the CORS issue flag
      sessionStorage.setItem('firebase_storage_cors_issue', 'true');
      
      throw new Error("Unable to upload image due to CORS restrictions. This is expected in local development.");
    }
    
    throw error;
  }
  */
};

export const getProfilePictureUrl = async (userId: string) => {
  try {
    // First check if we're in development mode
    const isDevelopment = import.meta.env.DEV || 
                          window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1';
    
    // If in development and we've previously had CORS issues, use placeholder immediately
    // This is stored in sessionStorage to persist during the session but not permanently
    const hasCorsIssue = sessionStorage.getItem('firebase_storage_cors_issue') === 'true';
    if (isDevelopment && hasCorsIssue) {
      return '/placeholder-avatar.svg';
    }
    
    // Try to get the profile picture
    const profilePicRef = storageRef(storage, `users/${userId}/profilePicture`);
    
    // Use a timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 5000);
    });
    
    // Race between the actual request and the timeout
    const url = await Promise.race([
      getDownloadURL(profilePicRef),
      timeoutPromise
    ]) as string;
    
    // Test if the URL is accessible with a HEAD request
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error('URL not accessible');
      }
    } catch (fetchError) {
      console.warn('URL not directly accessible, may have CORS issues');
      // We'll still return the URL and let the component handle the error
    }
    
    return url;
  } catch (error: any) {
    // Check if it's a CORS error or other network error
    if (error.code === 'storage/cors-error' || 
        error.code === 'storage/retry-limit-exceeded' ||
        error.message?.includes('CORS') || 
        error.message?.includes('network error') ||
        error.message === 'Request timed out') {
      
      console.warn('CORS or network error when fetching profile picture. Using placeholder instead.');
      
      // Store the CORS issue in sessionStorage to avoid repeated failed requests
      sessionStorage.setItem('firebase_storage_cors_issue', 'true');
      
      // Return a placeholder image URL instead
      return '/placeholder-avatar.svg';
    } else if (error.code === 'storage/object-not-found') {
      // No profile picture exists, return placeholder
      return '/placeholder-avatar.svg';
    } else {
      console.error("Error fetching profile picture:", error);
      // Return placeholder for any other error
      return '/placeholder-avatar.svg';
    }
  }
};

// Database helper functions
export const saveFeedingSchedule = (userId: string, scheduleData: any) => {
  return safeSet(`feeding_schedules/${userId}`, scheduleData);
};

export const getFeedingSchedule = (userId: string, callback: (data: any) => void) => {
  return safeOnValue(`feeding_schedules/${userId}`, (snapshot: any) => {
    callback(snapshot.val() || {});
  });
};

export const triggerManualFeed = (userId: string, amount: number) => {
  return safeSet(`feeding_requests/${userId}`, {
    amount,
    timestamp: safeServerTimestamp(),
    status: 'pending'
  });
};

export const getFeedingHistory = (userId: string, callback: (data: any) => void) => {
  return safeOnValue(`feeding_history/${userId}`, (snapshot: any) => {
    callback(snapshot.val() || {});
  });
};

export const getDeviceStatus = (userId: string, callback: (data: any) => void) => {
  return safeOnValue(`devices/${userId}`, (snapshot: any) => {
    callback(snapshot.val() || {
      status: 'offline',
      lastSeen: Date.now() - 86400000, // 24 hours ago
      foodLevel: 0
    });
  });
};

export const getDevices = async (userId: string) => {
  return safeGet(`devices/${userId}`);
};

export const getWifiNetworks = (userId: string, callback: (data: any) => void) => {
  return safeOnValue(`wifi_networks/${userId}`, (snapshot: any) => {
    callback(snapshot.val() || {
      networks: [
        { ssid: 'WiFi Network 1', strength: 'Strong', secured: true },
        { ssid: 'WiFi Network 2', strength: 'Medium', secured: true },
        { ssid: 'WiFi Network 3', strength: 'Weak', secured: false }
      ],
      lastScan: Date.now()
    });
  });
};

export const setWifiCredentials = (userId: string, ssid: string, password: string) => {
  return safeSet(`wifi_credentials/${userId}`, {
    ssid,
    password,
    timestamp: safeServerTimestamp()
  });
};

export const deleteUserAccount = async (user: User, password: string) => {
  try {
    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email || '', password);
    await reauthenticateWithCredential(user, credential);
    
    // Delete user data from database
    await safeRemove(`users/${user.uid}`);
    
    // Delete user from authentication
    await deleteUser(user);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting user account:', error);
    return { success: false, error: error.message || 'Failed to delete account' };
  }
};

// Push notification functions
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      return { success: false, error: 'Messaging not available' };
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return { success: true };
    } else {
      return { success: false, error: 'Permission denied' };
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

export const saveUserFCMToken = async (userId: string, token: string) => {
  try {
    await safeSet(`fcm_tokens/${userId}`, {
      token,
      lastUpdated: safeServerTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return { success: false, error: error.message || 'Failed to save token' };
  }
};

export const removeUserFCMToken = async (userId: string) => {
  try {
    await safeRemove(`fcm_tokens/${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error removing FCM token:', error);
    return { success: false, error: error.message || 'Failed to remove token' };
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

// Email verification functions
export const sendVerificationEmail = async (user: User) => {
  return sendEmailVerification(user);
};

export const isEmailVerified = (user: User | null) => {
  return user?.emailVerified || false;
};

export const verifyEmail = async (actionCode: string) => {
  try {
    await applyActionCode(auth, actionCode);
    return true;
  } catch (error) {
    console.error("Error verifying email:", error);
    throw error;
  }
};

export const updateEmailVerificationStatus = async (userId: string, isVerified: boolean) => {
  try {
    await safeUpdate(`users/${userId}`, {
      emailVerified: isVerified
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating email verification status:', error);
    return { success: false, error: error.message || 'Failed to update verification status' };
  }
};

// Add global error handlers for Firebase services
auth.onAuthStateChanged(() => {}, (error) => {
  console.error("Firebase Auth error:", error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && typeof event.reason === 'object') {
    const error = event.reason;
    if (error.code && error.code.startsWith('firestore/') || 
        error.code && error.code.startsWith('storage/')) {
      console.warn('Firebase error caught by global handler:', error);
      // Prevent the error from propagating
      event.preventDefault();
    }
  }
});

// Add this function to update a user's role
export const updateUserRole = async (userId: string, role: 'admin' | 'user') => {
  try {
    await safeUpdate(`users/${userId}`, { role });
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message || 'Failed to update user role' };
  }
};

// Function to delete all users from the database
export const deleteAllUsers = async () => {
  try {
    // Remove all users from the database
    const usersRef = ref(database, 'users');
    await remove(usersRef);
    
    // Remove all feeding schedules
    const schedulesRef = ref(database, 'feeding_schedules');
    await remove(schedulesRef);
    
    // Remove all feeding history
    const historyRef = ref(database, 'feeding_history');
    await remove(historyRef);
    
    // Remove all device statuses
    const deviceStatusRef = ref(database, 'device_status');
    await remove(deviceStatusRef);
    
    console.log('All users and related data have been deleted from the database');
    
    // Create a fixed admin account after deleting all users
    await createFixedAdminAccount();
    
    return true;
  } catch (error) {
    console.error('Error deleting users:', error);
    throw error;
  }
};

export const getLastFeeding = async (deviceId: string) => {
  return safeGet(`feeding_history/${deviceId}/last`);
};

// Export the initialized services and utility functions
export { 
  app, 
  auth, 
  database, 
  firestore, 
  storage, 
  messaging,
  GoogleAuthProvider,
  checkLimit,
  initializeFirebase,
  // Include these database functions
  onValue,
  off,
  push,
  remove,
  serverTimestamp,
  ref,
  set,
  update,
  get
};
