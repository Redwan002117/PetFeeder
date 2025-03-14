#!/bin/bash

# Deploy database changes
echo "Deploying database changes..."
supabase db push

# Deploy application
echo "Deploying application..."
npm run build
vercel deploy --prod