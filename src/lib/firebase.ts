import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification as firebaseSendEmailVerification,
  applyActionCode,
  verifyBeforeUpdateEmail
} from "firebase/auth";
import { 
  getDatabase, 
  ref, 
  set, 
  onValue, 
  push, 
  update, 
  remove,
  get,
  serverTimestamp
} from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFEVV0zXBXeZkzdcVz6sARU5pHxJL80N4",
  authDomain: "catfeeder002117.firebaseapp.com",
  databaseURL: "https://catfeeder002117-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catfeeder002117",
  storageBucket: "catfeeder002117.firebasestorage.app",
  messagingSenderId: "185578811050",
  appId: "1:185578811050:web:eea3a21fd11073ae1e6ad3"
};

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
    messaging = getMessaging(app);
  } catch (error) {
    console.error("Failed to initialize Firebase messaging:", error);
  }
}

// Authentication helper functions
export const signIn = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    try {
      // Check if user already exists in the database
      const snapshot = await get(ref(database, `users/${user.uid}`));
      
      if (!snapshot.exists()) {
        // Create user data with role in the database
        const userData = {
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'user', // Default role for Google sign-in users
          createdAt: serverTimestamp(),
          permissions: {
            canFeed: true,
            canSchedule: true,
            canViewStats: true,
          }
        };
        
        await set(ref(database, `users/${user.uid}`), userData);
      }
    } catch (dbError) {
      console.error("Error saving user data after Google sign-in:", dbError);
      // Still return the auth result even if saving to DB fails
      // This allows the user to sign in, but they might have limited functionality
    }
    
    return result;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    
    // Provide more user-friendly error messages
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Sign-in was cancelled. Please try again.");
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error("Pop-up was blocked by your browser. Please allow pop-ups for this site.");
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error("Network error. Please check your internet connection and try again.");
    } else if (error.code === 'auth/user-disabled') {
      throw new Error("This account has been disabled. Please contact support.");
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error("An account already exists with the same email address but different sign-in credentials. Try signing in using a different method.");
    }
    
    throw error;
  }
};

export const signUp = async (email: string, password: string, isAdmin = false) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Create user data with role in the database
  const userData = {
    email: email,
    role: isAdmin ? 'admin' : 'user',
    createdAt: serverTimestamp(),
    emailVerified: false, // Track email verification status
    permissions: {
      canFeed: !isAdmin, // Regular users have feeding permissions by default
      canSchedule: !isAdmin, // Regular users have scheduling permissions by default
      canViewStats: true, // Everyone can view stats
    }
  };
  
  await set(ref(database, `users/${user.uid}`), userData);
  
  // Send verification email for admin accounts
  if (isAdmin) {
    await firebaseSendEmailVerification(user);
  }
  
  return userCredential;
};

export const getUserData = (userId: string) => {
  const userRef = ref(database, `users/${userId}`);
  return get(userRef);
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

export const signOut = () => {
  return firebaseSignOut(auth);
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
};

export const getProfilePictureUrl = async (userId: string) => {
  try {
    // First check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development' || 
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
  if (!messaging) return null;
  
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return null;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        // Get the token
        const token = await getToken(messaging, {
          vapidKey: 'BLBz-RwVqRGXtUwVr9O7a_nLLvTJxRqwHd2JEZc-oM5xz1LJLrcBLgL0q7xQZKyjKT0Kn9AOdkHk3x_yEeBVlSo'
        });
        return token;
      } catch (tokenError) {
        console.error('Error getting token:', tokenError);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('An error occurred while requesting notification permission:', error);
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
  return firebaseSendEmailVerification(user);
};

export const isEmailVerified = (user: User | null) => {
  return user?.emailVerified || false;
};

export const verifyEmail = async (oobCode: string) => {
  const auth = getAuth();
  return applyActionCode(auth, oobCode);
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

// Export Firebase instances and functions
export { 
  auth, 
  database, 
  storage, 
  ref, 
  update, 
  set, 
  get, 
  onAuthStateChanged 
};
