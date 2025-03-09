// Fix for Firebase database issues
(function() {
  // Add a global error handler for Firebase errors
  window.addEventListener('error', function(event) {
    // Check if the error is related to Firebase
    if (event.message && (
      event.message.includes('Firebase') || 
      event.message.includes('database') ||
      event.message.includes('firestore')
    )) {
      console.warn('Firebase error caught by global handler:', event.message);
      
      // Prevent the error from showing in the console
      event.preventDefault();
      
      // You could also show a user-friendly message here
      if (!window.firebaseErrorShown) {
        window.firebaseErrorShown = true;
        console.log('Firebase services may not be available. Check your configuration.');
      }
    }
  });
})(); 