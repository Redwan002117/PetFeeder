# Run this to see detailed errors
npx tsc --noEmit --pretty

# Fix React import issues
npm install --save-dev @types/react @types/react-dom

# Clear TypeScript cache and try again
rm -rf node_modules/.cache
npm run type-check
