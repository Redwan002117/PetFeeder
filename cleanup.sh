#!/bin/bash
# Script to clean up problematic files and create project structure

# Navigate to project folder
cd h:/PetFeeder

# Remove problematic files if they exist
if [ -f "src/App.js" ]; then
  echo "Removing problematic src/App.js file..."
  rm src/App.js
fi

# Check for other potential problematic files
if [ -f "src/index.js" ]; then
  echo "Removing problematic src/index.js file..."
  rm src/index.js
fi

# Ensure we have proper TypeScript files
echo "Ensuring TypeScript files are in place..."

# Create directories if they don't exist
mkdir -p src
mkdir -p src/pages
mkdir -p src/components
mkdir -p src/contexts
mkdir -p src/styles

# Create index.html if it doesn't exist
if [ ! -f "index.html" ]; then
  echo "Creating index.html..."
  echo '<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pet Feeder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>' > index.html
fi

echo "Cleanup completed successfully."
