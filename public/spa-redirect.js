// This script handles client-side routing with GitHub Pages
// It's based on the solution from https://github.com/rafgraph/spa-github-pages

// Redirect to the correct route if we're on a 404 page
(function() {
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
  
  // If we're on a route that doesn't exist, redirect to the home page
  if (document.title.includes('404') || document.body.innerHTML.includes('404')) {
    window.location.replace('/');
  }
})(); 