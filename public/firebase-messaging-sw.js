// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  // This will be replaced during build with actual values from environment variables
  apiKey: process.env.FIREBASE_API_KEY, // import dotenv
  authDomain: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  databaseURL: "https://catfeeder002117-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catfeeder002117",
  storageBucket: "XXXXXXXXXXXXXXXXXXXXXXXXXXX",
  messagingSenderId: "185578811050",
  appId: "1:185578811050:web:eea3a21fd11073ae1e6ad3"
});



// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
}); 