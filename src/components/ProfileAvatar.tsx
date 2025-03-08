import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfilePictureUrl } from "@/lib/firebase";
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
  const [retryCount, setRetryCount] = useState(0);

  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);
        
        // First try to use the photoURL from the user object if available
        if (user.photoURL) {
          try {
            // Test if the URL is accessible
            const response = await fetch(user.photoURL, { method: 'HEAD' });
            if (response.ok) {
              setPhotoURL(user.photoURL);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.log("User photoURL not accessible, falling back to storage");
          }
        }
        
        // Otherwise fetch from Firebase Storage
        const url = await getProfilePictureUrl(user.uid);
        setPhotoURL(url);
      } catch (err) {
        console.error("Error loading profile picture:", err);
        setError(true);
        
        // Retry with exponential backoff if we haven't reached max retries
        if (retryCount < 2) {
          const timeout = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, timeout);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfilePicture();
  }, [user, retryCount]);

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