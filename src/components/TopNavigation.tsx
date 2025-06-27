// src/components/TopNavigation.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ChefAvatar from './ChefAvatar';
import UserGuide from './UserGuide';
import { 
  Heart, 
  ShoppingCart, 
  Brain, 
  User, 
  LogOut, 
  Settings, 
  Menu, 
  X,
  ChefHat,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface TopNavigationProps {
  onShowFavorites: () => void;
  onShowShoppingList: () => void;
  onShowDietPlan: () => void;
  onShowAuthModal: () => void;
  onShowGuide?: () => void;
  favoritesCount?: number;
  shoppingListCount?: number;
}

export default function TopNavigation({
  onShowFavorites,
  onShowShoppingList,
  onShowDietPlan,
  onShowAuthModal,
  onShowGuide,
  favoritesCount = 0,
  shoppingListCount = 0
}: TopNavigationProps) {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setIsMenuOpen(false);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsMenuOpen(false);
    setShowUserMenu(false);
  };

  // Navigation items configuration
  const navItems = [
    {
      id: 'favorites',
      label: 'Favorites',
      icon: Heart,
      onClick: onShowFavorites,
      count: favoritesCount,
      color: 'text-red-500',
      mobileOnly: false
    },
    {
      id: 'shopping',
      label: 'Shopping',
      icon: ShoppingCart,
      onClick: onShowShoppingList,
      count: shoppingListCount,
      color: 'text-green-500',
      mobileOnly: false
    },
    {
      id: 'diet',
      label: 'Diet Plan',
      icon: Brain,
      onClick: onShowDietPlan,
      count: 0,
      color: 'text-purple-500',
      mobileOnly: false
    }
  ];

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20 px-3 sm:px-4 lg:px-6">
            
            {/* Logo Section - Responsive */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 lg:p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl shadow-lg">
                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <div className="hidden xs:block">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  PantryPal
                </h1>
                <div className="hidden sm:block">
                  <p className="text-xs lg:text-sm text-gray-500 leading-none">AI Recipe Platform</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item.onClick)}
                  className="relative group flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base"
                >
                  <item.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                  <span className="font-medium">{item.label}</span>
                  {item.count > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center animate-pulse">
                      {item.count > 99 ? '99+' : item.count}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* User Section and Mobile Menu Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* User Authentication - Responsive */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-colors group"
                  >
                    <ChefAvatar 
                      user={user} 
                      size="sm"
                      className="ring-2 ring-transparent group-hover:ring-purple-300 transition-all"
                    />
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-24 lg:max-w-32">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500 hidden lg:block">
                        Chef Level
                      </div>
                    </div>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                      
                      <button
                        onClick={() => handleMenuItemClick(() => {})}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                      </button>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onShowAuthModal}
                  className="flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-2 lg:py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm lg:text-base font-medium"
                >
                  <User className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="hidden sm:inline">Sign In</span>
                  <Sparkles className="w-3 h-3 lg:w-4 lg:h-4 text-yellow-300 animate-pulse" />
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

              <button
              onClick={onShowGuide}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
              title="Show User Guide"
              >
             <HelpCircle className="w-5 h-5" />
             </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)} />
          
          <div ref={menuRef} className="fixed top-0 right-0 h-full w-64 sm:w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-out">
            <div className="flex flex-col h-full">
              
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">PantryPal</h2>
                    <p className="text-xs text-gray-500">AI Recipe Platform</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Menu Items */}
              <div className="flex-1 py-4 space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item.onClick)}
                    className="w-full flex items-center gap-4 px-6 py-4 text-left text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="relative">
                      <item.icon className={`w-6 h-6 ${item.color} group-hover:scale-110 transition-transform`} />
                      {item.count > 0 && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {item.count > 99 ? '99+' : item.count}
                        </div>
                      )}
                    </div>
                    <span className="text-base font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Mobile Menu Footer */}
              <div className="p-4 border-t border-gray-200">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <ChefAvatar user={user} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleMenuItemClick(onShowAuthModal)}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}