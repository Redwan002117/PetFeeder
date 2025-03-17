/**
 * PetFeeder Deployment Script
 * 
 * This script automates the deployment process for the PetFeeder application.
 * It reads the main database schema file and executes it against the Supabase instance.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const schemaFile = path.join(__dirname, 'src', 'lib', 'DatabaseSchema.sql');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file.');
  process.exit(1);
}

// Main function
async function deploy() {
  console.log('Starting PetFeeder deployment...');
  
  try {
    // Read the schema file
    console.log(`Reading schema from ${schemaFile}`);
    const schema = fs.readFileSync(schemaFile, 'utf8');
    
    // Deploy to Supabase
    console.log('Deploying schema to Supabase...');
    
    // Write schema to temporary file for security (to avoid command injection)
    const tempFile = path.join(__dirname, 'temp-schema.sql');
    fs.writeFileSync(tempFile, schema);
    
    // Use Supabase CLI or direct PSQL connection
    // This is a placeholder - adjust based on your preferred deployment method
    execSync(`supabase db execute --db-url "${supabaseUrl}" --file "${tempFile}"`, {
      env: {
        ...process.env,
        SUPABASE_AUTH_TOKEN: supabaseKey
      },
      stdio: 'inherit'
    });
    
    // Clean up
    fs.unlinkSync(tempFile);
    
    console.log('Schema deployed successfully!');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Execute deployment
deploy().catch(console.error);
