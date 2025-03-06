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
  reauthenticateWithCredential
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

export const updatePassword = async (user: User, currentPassword: string, newPassword: string) => {
  // First reauthenticate the user
  const credential = EmailAuthProvider.credential(
    user.email!,
    currentPassword
  );
  
  await reauthenticateWithCredential(user, credential);
  
  // Then update the password
  return firebaseUpdatePassword(user, newPassword);
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
