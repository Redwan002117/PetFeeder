import { Cloudinary } from 'cloudinary-core';

// Configure Cloudinary
// Note: You should replace these with your actual Cloudinary credentials
// and ideally store them in environment variables
const cloudinaryConfig = {
  cloud_name: 'dgiip1hjs', // Replace with your cloud name
  api_key: '661465737781545',       // Replace with your API key
  api_secret: '0t4cPf1jVBoZuC0hSpEnGtC6zsw', // Replace with your API secret
  secure: true                   // Use HTTPS
};

// Create and export the Cloudinary instance
export const cloudinary = new Cloudinary({
  cloud_name: cloudinaryConfig.cloud_name,
  api_key: cloudinaryConfig.api_key,
  secure: cloudinaryConfig.secure
});

// Function to generate a Cloudinary URL for a user's profile picture
export const getCloudinaryProfilePicUrl = (userId: string) => {
  // This assumes you're storing profile pictures with a naming convention
  // like 'profile_pictures/user_[userId]'
  return cloudinary.url(`profile_pictures/user_${userId}`, {
    width: 200,
    height: 200,
    crop: 'fill',
    gravity: 'face',
    fetch_format: 'auto',
    quality: 'auto'
  });
};

// Function to upload an image to Cloudinary
// Note: For security reasons, direct uploads from the browser should use
// a signed upload preset or a server-side endpoint
export const getCloudinaryUploadUrl = () => {
  return `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/image/upload`;
};

// Generate a timestamp and signature for secure uploads
// In a real app, this should be done server-side
export const getCloudinaryUploadSignature = () => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  // Note: In a production app, you would generate this signature on the server
  // This is just a placeholder
  return {
    timestamp,
    signature: 'generated_signature_here' // This should be generated server-side
  };
}; 