// Simplified Cloudinary implementation without external dependencies

// Configure Cloudinary
const cloudinaryConfig = {
  cloud_name: 'dgiip1hjs', // Your cloud name
  api_key: '661465737781545', // Your API key
  api_secret: '0t4cPf1jVBoZuC0hSpEnGtC6zsw', // Your API secret
  secure: true // Use HTTPS
};

// Simple Cloudinary class implementation
class CloudinaryService {
  private cloudName: string;
  private apiKey: string;
  private secure: boolean;

  constructor(config: { cloud_name: string; api_key: string; secure: boolean }) {
    this.cloudName = config.cloud_name;
    this.apiKey = config.api_key;
    this.secure = config.secure;
  }

  url(publicId: string, options: any = {}) {
    const protocol = this.secure ? 'https' : 'http';
    const transformations = this.buildTransformations(options);
    return `${protocol}://res.cloudinary.com/${this.cloudName}/image/upload${transformations}/${publicId}`;
  }

  private buildTransformations(options: any) {
    const transformations = [];
    
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.crop) transformations.push(`c_${options.crop}`);
    if (options.gravity) transformations.push(`g_${options.gravity}`);
    if (options.fetch_format) transformations.push(`f_${options.fetch_format}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    
    return transformations.length > 0 ? `/${transformations.join(',')}` : '';
  }
}

// Create and export the Cloudinary instance
export const cloudinary = new CloudinaryService({
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