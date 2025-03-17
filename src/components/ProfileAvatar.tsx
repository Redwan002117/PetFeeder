import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from '@supabase/supabase-js';

interface ProfileAvatarProps {
  user: User | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const getInitials = (name?: string): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const getSizeClass = (size?: string): string => {
  switch (size) {
    case 'xs':
      return 'h-6 w-6 text-xs';
    case 'sm':
      return 'h-8 w-8 text-sm';
    case 'lg':
      return 'h-16 w-16 text-xl';
    case 'xl':
      return 'h-20 w-20 text-2xl'; // Add xl size
    case 'md':
    default:
      return 'h-10 w-10 text-base';
  }
};

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ 
  user, 
  size = 'md', 
  className = '' 
}) => {
  const sizeClass = getSizeClass(size);
  
  // Get user information
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  const name = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '?';
  const initials = getInitials(name);

  return (
    <Avatar className={`${sizeClass} ${className}`}>
      <AvatarImage src={avatarUrl || undefined} alt={name} />
      <AvatarFallback className="bg-primary text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default ProfileAvatar;