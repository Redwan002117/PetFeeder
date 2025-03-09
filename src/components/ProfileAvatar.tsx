import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from 'firebase/auth';
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
        setLoading(false);
        return;
      }

      // Use a default avatar if no custom image is available
      setPhotoURL('/default-avatar.svg');
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

  const handleImageError = () => {
    setError(true);
    // Set a default avatar on error
    setPhotoURL('/default-avatar.svg');
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage 
        src={photoURL || '/default-avatar.svg'} 
        alt="Profile" 
        onError={handleImageError}
      />
      <AvatarFallback>
        {loading ? (
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-full w-full rounded-full" />
        ) : (
          getInitials()
        )}
      </AvatarFallback>
    </Avatar>
  );
};

export default ProfileAvatar; 