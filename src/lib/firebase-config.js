/**
 * Firebase configuration
 * All sensitive values are loaded from environment variables
 * with fallback values for development
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDFEVV0zXBXeZkzdcVz6sARU5pHxJL80N4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "catfeeder002117.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://catfeeder002117-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "catfeeder002117",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "catfeeder002117.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "185578811050",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:185578811050:web:eea3a21fd11073ae1e6ad3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SYKHDLTWDZ"
};

// Log a warning if using fallback values
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  console.warn('Using fallback Firebase configuration. Set environment variables for production use.');
}

export default firebaseConfig; 