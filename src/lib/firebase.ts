
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
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

// Your Firebase configuration
const firebaseConfig = {
  // Replace with your actual Firebase config
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Authentication helper functions
export const signIn = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUp = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signOut = () => {
  return firebaseSignOut(auth);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
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

export { auth, database, onAuthStateChanged };
