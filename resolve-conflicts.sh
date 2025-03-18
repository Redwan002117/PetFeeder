#!/bin/bash
# Script to resolve the current merge conflict

# Navigate to project folder
cd h:/PetFeeder

# Check which files have conflicts
CONFLICT_FILES=$(git diff --name-only --diff-filter=U)

# Open each conflicted file in the default editor
for file in $CONFLICT_FILES; do
  echo "Opening $file to resolve conflicts..."
  start $file
done

echo "After resolving conflicts in the editor:"
echo "1. Save the file(s)"
echo "2. Run the following commands:"
echo "   git add ."
echo "   git commit -m 'Resolve merge conflicts'"
echo "   git push -u origin main"

echo ""
echo "If you're having issues with Tailwind CSS configuration:"
echo "1. Make sure postcss.config.js is using 'tailwindcss' plugin directly"
echo "2. Ensure tailwind.config.js exists and is properly configured"

# Alternative automatic resolution (uncomment if you want to keep all local changes)
# for file in $CONFLICT_FILES; do
#   git checkout --ours $file
# done
# git add .
# git commit -m "Resolve merge conflicts by keeping local changes"
# git push -u origin main
