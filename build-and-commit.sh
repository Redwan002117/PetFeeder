# Navigate to your project folder
cd h:/PetFeeder

# Install dependencies
npm install
npm install --save uuid # Ensure uuid is installed

# Initialize git repository if not already done
git init

# Create a .gitignore file to exclude node_modules
echo "node_modules/" > .gitignore
echo "dist/" >> .gitignore
echo ".env" >> .gitignore

# Stage your files
git add .

# Commit your changes
git commit -m "Initial commit for PetFeeder project"

# Add the GitHub repository as remote origin (if not already added)
git remote -v | grep -q "origin" || git remote add origin https://github.com/Redwan002117/PetFeeder.git

# Pull changes from remote with --allow-unrelated-histories
git pull origin main --allow-unrelated-histories

# Handle potential merge conflicts
if [ $? -ne 0 ]; then
  echo "Merge conflicts detected. Please resolve conflicts manually, then run: git add . && git commit -m 'Resolve merge conflicts' && git push -u origin main"
  exit 1
fi

# Push to GitHub
git push -u origin main
