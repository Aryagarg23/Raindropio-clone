import React from 'react';

interface ProfileIconProps {
  user: {
    avatar_url?: string;
    full_name?: string;
    email?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function ProfileIcon({ user, size = 'md', className = '' }: ProfileIconProps) {
  const sizeClasses = {
    xs: 'w-4 h-4 text-xs',
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm',
    xl: 'w-10 h-10 text-base'
  };

  const sizeClass = sizeClasses[size];

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name || user.email || 'User'}
        className={`${sizeClass} rounded-full object-cover shadow-sm border border-white ${className}`}
        onError={(e) => {
          // Hide broken image and show fallback
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  // Fallback to initials
  const initials = (user.full_name || user.email || 'U')[0].toUpperCase();

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 flex items-center justify-center text-white font-semibold shadow-sm ${className}`}>
      {initials}
    </div>
  );
}