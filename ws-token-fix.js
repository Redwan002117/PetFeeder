// Fix for WebSocket token error in production
// This script is loaded before any other scripts
(function() {
  // Define __WS_TOKEN__ if it's not defined
  if (typeof window.__WS_TOKEN__ === 'undefined') {
    window.__WS_TOKEN__ = null;
    console.log('WebSocket token fix applied');
  }
})(); 