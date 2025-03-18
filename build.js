const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to run shell command and handle errors
function run(command) {
  try {
    console.log(`> ${command}`);
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    process.exit(1);
  }
}

// Create directories if they don't exist
const directories = ['src', 'src/pages', 'src/components', 'src/contexts', 'src/styles'];
directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Delete problematic files if they exist
const problematicFiles = ['src/App.js', 'src/index.js'];
problematicFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`Removing problematic file: ${file}`);
    fs.unlinkSync(filePath);
  }
});

// Run npm commands
console.log('Installing dependencies...');
run('npm install');
run('npm install --save-dev tailwindcss postcss autoprefixer terser');
run('npm install --save uuid');

// Fix the imports and build the project
console.log('Building project...');
run('npx vite build');

console.log('Build completed successfully!');
