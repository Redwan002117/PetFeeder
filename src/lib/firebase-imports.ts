// Import Firebase modules explicitly
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

// Re-export them
export {
  initializeApp,
  getAuth,
  getDatabase,
  getStorage,
  getMessaging
}; 