// This file is used to import Firebase modules dynamically to avoid build issues
// Import Firebase modules
import { getStorage as importGetStorage } from 'firebase/storage';
import { getMessaging as importGetMessaging } from 'firebase/messaging';
import { getAuth as importGetAuth } from 'firebase/auth';
import { getDatabase as importGetDatabase } from 'firebase/database';

// Export the functions
export const getStorage = importGetStorage;
export const getMessaging = importGetMessaging;
export const getAuth = importGetAuth;
export const getDatabase = importGetDatabase; 