import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from 'firebase/auth';
import { Image, Transformation } from 'cloudinary-react';
import { cloudinary } from '@/lib/cloudinary';

interface ProfileAvatarProps {
  user: User | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ 
  user, 
  size = 'md',
  className = '' 
}) => {
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useCloudinary, setUseCloudinary] = useState(false);

  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  // Size values for Cloudinary transformations
  const sizeValues = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96
  };

  useEffect(() => {
    const setProfilePicture = () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // If user has a photoURL from their auth provider (Google, etc.), use it
      if (user.photoURL) {
        setPhotoURL(user.photoURL);
        setUseCloudinary(false);
      } else {
        // Try to use Cloudinary
        try {
          // This assumes you've uploaded the image to Cloudinary with a public_id
          // that includes the user's ID, like 'profile_pictures/user_[userId]'
          const cloudinaryUrl = cloudinary.url(`profile_pictures/user_${user.uid}`, {
            width: sizeValues[size],
            height: sizeValues[size],
            crop: 'fill',
            gravity: 'face',
            fetch_format: 'auto',
            quality: 'auto'
          });
          
          setPhotoURL(cloudinaryUrl);
          setUseCloudinary(true);
        } catch (err) {
          console.error("Error generating Cloudinary URL:", err);
          // Fallback to placeholder
          setPhotoURL('/placeholder-avatar.svg');
          setUseCloudinary(false);
        }
      }
      
      setLoading(false);
    };

    setProfilePicture();
  }, [user, size]);

  // Get initials from user's display name or email
  const getInitials = (): string => {
    if (!user) return '?';
    
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    
    return '?';
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {useCloudinary && photoURL ? (
        <div className="w-full h-full overflow-hidden rounded-full">
          <Image 
            cloudName={cloudinary.config().cloud_name}
            publicId={`profile_pictures/user_${user?.uid}`}
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          >
            <Transformation width={sizeValues[size]} height={sizeValues[size]} crop="fill" gravity="face" />
            <Transformation fetchFormat="auto" quality="auto" />
          </Image>
        </div>
      ) : (
        <AvatarImage 
          src={photoURL || '/placeholder-avatar.svg'} 
          alt="Profile" 
          className={error ? 'opacity-0' : ''}
          onError={() => setError(true)}
        />
      )}
      <AvatarFallback>
        {loading ? (
          <div className="animate-pulse bg-gray-200 h-full w-full rounded-full" />
        ) : (
          getInitials()
        )}
      </AvatarFallback>
    </Avatar>
  );
};

export default ProfileAvatar; 