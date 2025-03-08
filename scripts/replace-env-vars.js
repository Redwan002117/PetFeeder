import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the environment variables
const apiKey = process.env.VITE_FIREBASE_API_KEY || '';
const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN || '';
const databaseURL = process.env.VITE_FIREBASE_DATABASE_URL || '';
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || '';
const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET || '';
const messagingSenderId = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '';
const appId = process.env.VITE_FIREBASE_APP_ID || '';

// Path to the service worker file in the dist directory
const swPath = path.join(__dirname, '../dist/firebase-messaging-sw.js');

// Check if the file exists
if (fs.existsSync(swPath)) {
  // Read the file content
  let content = fs.readFileSync(swPath, 'utf8');
  
  // Replace the placeholders with actual values
  content = content.replace('FIREBASE_API_KEY_PLACEHOLDER', apiKey);
  content = content.replace('FIREBASE_AUTH_DOMAIN_PLACEHOLDER', authDomain);
  content = content.replace('FIREBASE_DATABASE_URL_PLACEHOLDER', databaseURL);
  content = content.replace('FIREBASE_PROJECT_ID_PLACEHOLDER', projectId);
  content = content.replace('FIREBASE_STORAGE_BUCKET_PLACEHOLDER', storageBucket);
  content = content.replace('FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER', messagingSenderId);
  content = content.replace('FIREBASE_APP_ID_PLACEHOLDER', appId);
  
  // Write the updated content back to the file
  fs.writeFileSync(swPath, content, 'utf8');
  
  console.log('Environment variables replaced in firebase-messaging-sw.js');
} else {
  console.error('firebase-messaging-sw.js not found in dist directory');
} 