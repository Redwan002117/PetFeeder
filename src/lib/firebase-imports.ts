// This file contains all Firebase imports to avoid circular dependencies
// and to make it easier to mock Firebase services for testing

import { initializeApp } from 'firebase/app';
import { getAuth as importGetAuth } from 'firebase/auth';
import { getDatabase as importGetDatabase } from 'firebase/database';
import { getStorage as importGetStorage } from 'firebase/storage';
import { getMessaging as importGetMessaging } from 'firebase/messaging';

// Re-export the Firebase functions
export const getAuth = importGetAuth;
export const getDatabase = importGetDatabase;
export const getStorage = importGetStorage;

// Only export getMessaging if we're in a browser environment
export const getMessaging = typeof window !== 'undefined' && 'serviceWorker' in navigator
  ? importGetMessaging
  : () => null; 