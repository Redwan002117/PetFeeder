#!/bin/bash

# Create a new Supabase project (if needed)
echo "Please create a new Supabase project at https://app.supabase.com if you haven't already"
echo "Press Enter when ready to continue..."
read

# Install dependencies
echo "Installing Supabase dependencies..."
npm install @supabase/supabase-js

# Remove Firebase dependencies
echo "Removing Firebase dependencies..."
npm uninstall firebase @firebase/app @firebase/auth @firebase/firestore

# Set up environment variables
echo "Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file from .env.example"
    echo "Please update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
fi

# Run database migrations
echo "Running database migrations..."
supabase db reset --db-url=YOUR_DATABASE_URL

echo "Done! Next steps:"
echo "1. Update your .env file with your Supabase credentials"
echo "2. Deploy your application with 'npm run deploy'"