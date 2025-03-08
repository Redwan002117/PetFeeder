import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Remove the import for getProfilePictureUrl since we won't use it
// import { getProfilePictureUrl } from "@/lib/firebase";
import { User } from 'firebase/auth';

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

  useEffect(() => {
    const setProfilePicture = () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // If user has a photoURL from their auth provider (Google, etc.), use it
      if (user.photoURL) {
        setPhotoURL(user.photoURL);
      } else {
        // Otherwise use a placeholder
        setPhotoURL('/placeholder-avatar.svg');
      }
      
      setLoading(false);
    };

    setProfilePicture();
  }, [user]);

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
      <AvatarImage 
        src={photoURL || '/placeholder-avatar.svg'} 
        alt="Profile" 
        className={error ? 'opacity-0' : ''}
        onError={() => setError(true)}
      />
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