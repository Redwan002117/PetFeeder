// Simple SPA redirect script for GitHub Pages
// No DOM manipulation, just URL handling
(function() {
  // Skip on localhost
  if (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1') {
    return;
  }

  // Get the current path
  var path = window.location.pathname;
  
  // Handle direct navigation to routes
  if (path !== '/' && 
      !path.endsWith('.html') && 
      !path.endsWith('.js') && 
      !path.endsWith('.css') && 
      !path.endsWith('.png') && 
      !path.endsWith('.ico') && 
      !path.endsWith('.svg') && 
      !path.endsWith('/')) {
    
    // Add trailing slash to prevent 404s
    window.location.replace(path + '/' + window.location.search + window.location.hash);
  }
})(); 