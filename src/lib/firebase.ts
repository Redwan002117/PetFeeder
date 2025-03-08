import { initializeApp } from "firebase/app";
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
  applyActionCode
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
  serverTimestamp
} from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import { getToken, onMessage } from "firebase/messaging";
import firebaseConfig from "./firebase-config";
import { throttle } from 'lodash';

// Environment detection
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Configure Firebase Storage CORS settings
// Note: This is a client-side setting and won't affect the actual Firebase Storage CORS rules
// You need to configure CORS in the Firebase console for production
try {
  storage.maxOperationRetryTime = 20000; // Increase retry time
  storage.maxUploadRetryTime = 20000; // Increase upload retry time
} catch (error) {
  console.error("Error configuring storage:", error);
}

let messaging: any = null;

// Initialize Firebase Cloud Messaging and get a reference to the service
// Only initialize in browser environment, not in service worker
if (typeof window !== 'undefined') {
  try {
    // Import messaging dynamically to avoid issues with ad blockers
    import('firebase/messaging').then(({ getMessaging }) => {
      if (!adBlockerDetected) {
        messaging = getMessaging(app);
        console.log('Firebase messaging initialized successfully');
      } else {
        console.log('Skipping Firebase messaging initialization due to ad blocker');
      }
    }).catch(error => {
      console.error('Error initializing Firebase messaging:', error);
    });
  } catch (error) {
    console.error('Error importing Firebase messaging:', error);
  }
}

// Add this rate limiting utility
const rateLimiter = {
  timestamps: {},
  maxRequests: 10,
  timeWindow: 60000, // 1 minute
  
  checkLimit(key: string): boolean {
    const now = Date.now();
    const timestamps = this.timestamps[key] || [];
    
    // Remove timestamps outside the time window
    const recentTimestamps = timestamps.filter(ts => now - ts < this.timeWindow);
    
    // Check if the number of recent requests exceeds the limit
    if (recentTimestamps.length >= this.maxRequests) {
      console.warn(`Rate limit exceeded for ${key}`);
      return false;
    }
    
    // Add the current timestamp
    recentTimestamps.push(now);
    this.timestamps[key] = recentTimestamps;
    
    return true;
  }
};

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
  return {
    provider: googleProvider,
    auth
  };
};

// Update the signInWithGoogle function to accept a username parameter
export const signInWithGoogle = async (username?: string) => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // If username is provided, it means this is a new user registration
    if (username) {
      try {
        // Check if username is already taken
        const usersRef = ref(database, 'users');
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
            throw new Error("Username is already taken. Please choose a different username.");
          }
        }
        
        // Update user profile with the provided username
        await updateProfile(user, {
          displayName: username
        });
        
        // Check if user already exists in the database
        const userSnapshot = await get(ref(database, `users/${user.uid}`));
        
        if (!userSnapshot.exists()) {
          // Create new user data
          const userData = {
            email: user.email,
            displayName: username,
            role: 'user',
            permissions: {
              canFeed: true,
              canSchedule: true,
              canViewStats: true
            },
            createdAt: serverTimestamp(),
            provider: 'google'
          };
          
          // Save user data to database
          await set(ref(database, `users/${user.uid}`), userData);
        } else {
          // Update existing user data with new username
          await update(ref(database, `users/${user.uid}`), {
            displayName: username
          });
        }
      } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
      }
    } else {
      // This is a sign-in, not a registration
      // Check if user exists in the database
      const snapshot = await get(ref(database, `users/${user.uid}`));
      
      if (!snapshot.exists()) {
        // User doesn't exist in the database yet, redirect to username setup
        throw new Error("Please set up your username first");
      }
    }
    
    return result;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    
    // Provide more user-friendly error messages
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Google sign-in was cancelled. Please try again.");
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error("Pop-up was blocked by your browser. Please allow pop-ups for this site.");
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error("An account already exists with the same email address but different sign-in credentials.");
    }
    
    throw error;
  }
};

export const registerUser = async (email: string, password: string, name: string, username: string) => {
  try {
    // Check if username is already taken
    const usersRef = ref(database, 'users');
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
        throw new Error("Username is already taken. Please choose a different username.");
      }
    }
    
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile with the provided username
    await updateProfile(user, {
      displayName: username
    });
    
    // Send email verification
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
    await set(ref(database, `users/${user.uid}`), userData);
    
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
  try {
    await set(ref(database, path), data);
  } catch (error) {
    console.error(`Error setting data at ${path}:`, error);
    throw error;
  }
};

export const updateData = async (path: string, data: any) => {
  try {
    await update(ref(database, path), data);
  } catch (error) {
    console.error(`Error updating data at ${path}:`, error);
    throw error;
  }
};

export const getData = async (path: string) => {
  try {
    // Apply rate limiting if needed
    const rateLimitKey = `getData_${path}`;
    if (rateLimiter && !rateLimiter.checkLimit(rateLimitKey)) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    
    const snapshot = await get(ref(database, path));
    // Check if snapshot exists using the proper method for Realtime Database
    return snapshot.exists ? snapshot.val() : null;
  } catch (error) {
    console.error(`Error getting data from ${path}:`, error);
    throw error;
  }
};

export const getUserData = async (userId: string) => {
  try {
    // Apply rate limiting
    const rateLimitKey = `getUserData_${userId}`;
    if (!rateLimiter.checkLimit(rateLimitKey)) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    
    return await getData(`users/${userId}`);
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error;
  }
};

export const removeData = async (path: string) => {
  try {
    await remove(ref(database, path));
  } catch (error) {
    console.error(`Error removing data at ${path}:`, error);
    throw error;
  }
};

export const getAllUsers = (callback: (users: any) => void) => {
  const usersRef = ref(database, 'users');
  return onValue(usersRef, (snapshot) => {
    const users = snapshot.val();
    callback(users);
  });
};

export const updateUserPermissions = (userId: string, permissions: any) => {
  const userPermissionsRef = ref(database, `users/${userId}/permissions`);
  return update(userPermissionsRef, permissions);
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
  const scheduleRef = ref(database, `users/${userId}/feedingSchedule`);
  return set(scheduleRef, scheduleData);
};

export const getFeedingSchedule = (userId: string, callback: (data: any) => void) => {
  const scheduleRef = ref(database, `users/${userId}/feedingSchedule`);
  return onValue(scheduleRef, (snapshot) => {
    callback(snapshot.val());
  });
};

export const triggerManualFeed = (userId: string, amount: number) => {
  const feedRef = ref(database, `users/${userId}/manualFeed`);
  return set(feedRef, {
    timestamp: serverTimestamp(),
    amount,
    status: 'pending'
  });
};

export const getFeedingHistory = (userId: string, callback: (data: any) => void) => {
  const historyRef = ref(database, `users/${userId}/feedingHistory`);
  return onValue(historyRef, (snapshot) => {
    callback(snapshot.val());
  });
};

export const getDeviceStatus = (userId: string, callback: (data: any) => void) => {
  const deviceRef = ref(database, `users/${userId}/deviceStatus`);
  return onValue(deviceRef, (snapshot) => {
    callback(snapshot.val());
  });
};

export const getWifiNetworks = (userId: string, callback: (data: any) => void) => {
  const wifiRef = ref(database, `users/${userId}/wifiNetworks`);
  return onValue(wifiRef, (snapshot) => {
    callback(snapshot.val());
  });
};

export const setWifiCredentials = (userId: string, ssid: string, password: string) => {
  const wifiCredentialsRef = ref(database, `users/${userId}/wifiCredentials`);
  return set(wifiCredentialsRef, {
    ssid,
    password,
    timestamp: serverTimestamp()
  });
};

export const deleteUserAccount = async (user: User, password: string) => {
  // First reauthenticate the user
  const credential = EmailAuthProvider.credential(
    user.email!,
    password
  );
  
  await reauthenticateWithCredential(user, credential);
  
  // Delete user data from database
  await remove(ref(database, `users/${user.uid}`));
  
  // Delete user authentication account
  return user.delete();
};

// Push notification functions
export const requestNotificationPermission = async () => {
  if (adBlockerDetected) {
    console.log('Skipping notification permission request due to ad blocker');
    return null;
  }
  
  if (!messaging) {
    console.error("Firebase messaging is not initialized");
    return null;
  }
  
  try {
    // Check if notification permission is already granted
    if (Notification.permission === 'granted') {
      // Get token
      return await getToken(messaging, { 
        vapidKey: 'BLBz-RwVqRGXtUwVr9O7a_nLLvTJxRqwHd2JEZc-oM5xz1LJLrcBLgL0q7xQZKyjKT0Kn9AOdkHk3x_yEeBVlSo' 
      });
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Get token
      return await getToken(messaging, { 
        vapidKey: 'BLBz-RwVqRGXtUwVr9O7a_nLLvTJxRqwHd2JEZc-oM5xz1LJLrcBLgL0q7xQZKyjKT0Kn9AOdkHk3x_yEeBVlSo' 
      });
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
};

export const saveUserFCMToken = (userId: string, token: string) => {
  const tokenRef = ref(database, `users/${userId}/fcmTokens/${token}`);
  return set(tokenRef, {
    createdAt: serverTimestamp(),
    platform: 'web'
  });
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
  const userRef = ref(database, `users/${userId}/emailVerified`);
  return set(userRef, isVerified);
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
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, { role });
    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

// Create a fixed admin account on initialization
const createFixedAdminAccount = async () => {
  const adminEmail = "Gamerno002117@redwancodes.com";
  const adminPassword = "@Fuckyou#hacker99.002117";
  const adminUsername = "AdminGamer002117";

  try {
    // Check if admin account already exists
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      // Check all users to find if admin email exists
      let adminExists = false;
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.email === adminEmail) {
          adminExists = true;
          return true; // Break the forEach loop
        }
      });
      
      if (adminExists) {
        console.log("Admin account already exists");
        return;
      }
    }
    
    // Create admin account if it doesn't exist
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;
      
      // Update profile with username
      await updateProfile(user, {
        displayName: adminUsername
      });
      
      // Send verification email
      await sendEmailVerification(user);
      
      // Save user data to database with admin role
      const userData = {
        email: adminEmail,
        displayName: adminUsername,
        role: 'admin',
        permissions: {
          canFeed: true,
          canSchedule: true,
          canViewStats: true
        },
        createdAt: serverTimestamp()
      };
      
      await set(ref(database, `users/${user.uid}`), userData);
      console.log("Admin account created successfully");
    } catch (error: any) {
      // If the error is because the user already exists, try to sign in and update
      if (error.code === 'auth/email-already-in-use') {
        try {
          // Sign in with admin credentials
          const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
          const user = userCredential.user;
          
          // Update profile if needed
          if (user.displayName !== adminUsername) {
            await updateProfile(user, {
              displayName: adminUsername
            });
          }
          
          // Update user data in database
          const userRef = ref(database, `users/${user.uid}`);
          await update(userRef, { 
            role: 'admin',
            displayName: adminUsername,
            permissions: {
              canFeed: true,
              canSchedule: true,
              canViewStats: true
            }
          });
          
          // Sign out after updating
          await firebaseSignOut(auth);
          console.log("Admin account updated successfully");
        } catch (signInError) {
          console.error("Error signing in to admin account:", signInError);
        }
      } else {
        console.error("Error creating admin account:", error);
      }
    }
  } catch (error) {
    console.error("Error checking for admin account:", error);
  }
};

// Call the function to create the admin account when the app initializes
if (typeof window !== 'undefined') {
  createFixedAdminAccount().catch(console.error);
}

// Export Firebase instances and functions
export { 
  app, 
  auth, 
  database, 
  storage, 
  ref, 
  update, 
  set, 
  get, 
  onAuthStateChanged 
};
