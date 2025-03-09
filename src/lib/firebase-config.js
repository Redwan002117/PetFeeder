/**
 * Firebase configuration
 * All sensitive values are loaded from environment variables
 * with fallback values for development
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDFEVV0zXBXeZkzdcVz6sARU5pHxJL80N4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "petfeeder-hub.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://petfeeder-hub-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "petfeeder-hub",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "petfeeder-hub.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef1234567890",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ABCDEFGHIJ"
};

// Log a warning if using fallback values
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  console.warn('Using fallback Firebase configuration. Set environment variables for production use.');
}

export default firebaseConfig; 