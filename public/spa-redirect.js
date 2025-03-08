// This script handles client-side routing with GitHub Pages
// It's based on the solution from https://github.com/rafgraph/spa-github-pages

// Wrap everything in a function that runs when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Don't run this script on the development server
  if (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1') {
    return;
  }

  // Get the current path
  var path = window.location.pathname;
  
  // If we're not at the root and the path doesn't end with a slash
  // and the path doesn't contain a dot (likely a file extension)
  if (path !== '/' && !path.endsWith('/') && path.indexOf('.') === -1) {
    // Redirect to the same path with a trailing slash
    window.location.replace(path + '/' + window.location.search + window.location.hash);
    return;
  }
  
  // Check for 404 page in a safe way
  try {
    var pageTitle = document.title || '';
    var bodyContent = '';
    
    if (document.body) {
      bodyContent = document.body.textContent || '';
    }
    
    if (pageTitle.includes('404') || bodyContent.includes('404')) {
      window.location.replace('/');
    }
  } catch (error) {
    console.error('Error in SPA redirect script:', error);
  }
}); 