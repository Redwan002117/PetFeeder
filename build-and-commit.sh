# Navigate to your project folder
cd h:/PetFeeder

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

# Add the GitHub repository as remote origin
git remote add origin https://github.com/YOUR_USERNAME/PetFeeder.git

# Push to GitHub
git push -u origin main
