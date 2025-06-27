// src/components/ResponsiveModal.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showHeader?: boolean;
  className?: string;
  closeOnBackdrop?: boolean;
  fullScreenOnMobile?: boolean;
}

export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showHeader = true,
  className = '',
  closeOnBackdrop = true,
  fullScreenOnMobile = false
}: ResponsiveModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    setIsMounted(true);
    
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isMounted || !isOpen) return null;

  // Size configurations - mobile first approach
  const getSizeClasses = () => {
    const baseClasses = 'w-full';
    
    switch (size) {
      case 'sm':
        return `${baseClasses} max-w-sm sm:max-w-md`;
      case 'md':
        return `${baseClasses} max-w-lg sm:max-w-xl md:max-w-2xl`;
      case 'lg':
        return `${baseClasses} max-w-xl sm:max-w-2xl md:max-w-4xl lg:max-w-5xl`;
      case 'xl':
        return `${baseClasses} max-w-2xl sm:max-w-4xl md:max-w-6xl lg:max-w-7xl`;
      case 'full':
        return `${baseClasses} max-w-full sm:max-w-[95vw] md:max-w-[90vw]`;
      default:
        return `${baseClasses} max-w-lg sm:max-w-xl md:max-w-2xl`;
    }
  };

  // Mobile vs Desktop layout classes
  const getLayoutClasses = () => {
    if (fullScreenOnMobile) {
      return {
        container: 'fixed inset-0 z-50',
        backdrop: 'absolute inset-0 bg-black/50 backdrop-blur-sm',
        wrapper: 'relative z-10 h-full flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8',
        modal: `${getSizeClasses()} h-full sm:h-auto max-h-full sm:max-h-[95vh] bg-white rounded-none sm:rounded-xl md:rounded-2xl shadow-2xl overflow-hidden`
      };
    }
    
    return {
      container: 'fixed inset-0 z-50 flex items-end sm:items-center justify-center',
      backdrop: 'absolute inset-0 bg-black/50 backdrop-blur-sm',
      wrapper: 'relative z-10 w-full h-auto flex items-end sm:items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8',
      modal: `${getSizeClasses()} max-h-[90vh] sm:max-h-[95vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-out`
    };
  };

  const layoutClasses = getLayoutClasses();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={layoutClasses.container}>
      {/* Backdrop */}
      <div 
        className={layoutClasses.backdrop}
        onClick={handleBackdropClick}
      />
      
      {/* Modal Container */}
      <div className={layoutClasses.wrapper} onClick={handleBackdropClick}>
        <div 
          className={`${layoutClasses.modal} ${className}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: isOpen ? 'modalSlideUp 0.3s ease-out' : undefined
          }}
        >
          
          {/* Header */}
          {showHeader && (
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
              {/* Mobile pull indicator */}
              <div className="sm:hidden flex justify-center py-2">
                <div className="w-8 h-1 bg-gray-300 rounded-full" />
              </div>
              
              <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                {title && (
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate pr-4 flex-1">
                    {title}
                  </h2>
                )}
                
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-2 sm:p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (min-width: 640px) {
          @keyframes modalSlideUp {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        }
      `}</style>
    </div>
  );
}