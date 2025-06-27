// src/components/ChefAvatar.tsx

'use client';

import React from 'react';
import { ChefHat } from 'lucide-react';

interface ChefAvatarProps {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showChefHat?: boolean;
  className?: string;
}

export default function ChefAvatar({ 
  user, 
  size = 'md', 
  showChefHat = true, 
  className = '' 
}: ChefAvatarProps) {
  // Size configurations
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const chefHatSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  // Generate consistent color based on user email/id
  const generateAvatarColor = (seed: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-cyan-500',
      'bg-emerald-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Get user initials
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const avatarColor = generateAvatarColor(user.email || user.id);
  const initials = getInitials(user.name);

  return (
    <div className={`relative ${className}`}>
      {/* Main Avatar */}
      <div className={`
        ${sizeClasses[size]} 
        ${avatarColor} 
        rounded-full 
        flex 
        items-center 
        justify-center 
        text-white 
        font-semibold 
        shadow-md
        border-2 
        border-white
      `}>
        {user.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="select-none">
            {initials}
          </span>
        )}
      </div>

      {/* Chef Hat Badge */}
      {showChefHat && (
        <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-gray-200">
          <ChefHat className={`${chefHatSizes[size]} text-orange-500`} />
        </div>
      )}
    </div>
  );
}