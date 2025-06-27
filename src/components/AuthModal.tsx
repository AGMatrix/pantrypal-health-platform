// src/components/AuthModal.tsx

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'forgot') {
        // Handle forgot password
        await handleForgotPassword();
      } else {
        let result;
        
        if (mode === 'login') {
          result = await login(email.trim(), password);
        } else {
          result = await register(email.trim(), password, name.trim());
        }

        if (result.success) {
          console.log('✅ Authentication successful');
          onClose();
          resetForm();
        } else {
          console.log('❌ Authentication failed:', result.error);
          setError(result.error || 'Authentication failed');
        }
      }
    } catch (err) {
      console.error('❌ Unexpected auth error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
const handleForgotPassword = async () => {
  if (!email.trim()) {
    setError('Please enter your email address');
    return;
  }

  if (!email.includes('@')) {
    setError('Please enter a valid email address');
    return;
  }

  try {
    console.log('🔄 Sending password reset email to:', email);
    
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Password reset email sent successfully');
      setSuccess(`📧 Password reset instructions have been sent to ${email}. Check your inbox!`);
      setError('');
      
      // Auto switch back to login after 5 seconds
      setTimeout(() => {
        setMode('login');
        setSuccess('');
      }, 5000);
    } else {
      console.error('❌ Failed to send reset email:', result.error);
      setError(result.error || 'Failed to send reset email. Please try again.');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
    setError('Network error. Please check your connection and try again.');
  }
};

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setError('');
    setSuccess('');
    if (newMode !== 'forgot') {
      setEmail('');
      setPassword('');
      setName('');
    }
  };

  // Demo credentials helper
  const fillDemoCredentials = () => {
    setEmail('demo@example.com');
    setPassword('demo123');
    setError('');
    setSuccess('');
  };

  const fillChefCredentials = () => {
    setEmail('chef@example.com');
    setPassword('chef123');
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!email.trim()) return 'Email is required';
    if (!email.includes('@')) return 'Please enter a valid email';
    
    if (mode === 'forgot') return null;
    
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (mode === 'register' && !name.trim()) return 'Name is required';
    if (mode === 'register' && name.trim().length < 2) return 'Name must be at least 2 characters';
    return null;
  };

  const formError = validateForm();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
        {/* Header */}
        <div className="text-center mb-8">
          {mode === 'forgot' && (
            <button
              onClick={() => switchMode('login')}
              className="absolute left-4 top-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Back to login"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            {mode === 'forgot' ? (
              <Mail className="w-8 h-8 text-white" />
            ) : (
              <span className="text-2xl text-white">🍳</span>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          
          <p className="text-gray-600 mt-2">
            {mode === 'login' && 'Sign in to access your recipes and favorites'}
            {mode === 'register' && 'Join us to save recipes and create meal plans'}
            {mode === 'forgot' && 'Enter your email to receive reset instructions'}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field (Register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Field (Not for forgot password) */}
          {mode !== 'forgot' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters
                </p>
              )}
            </div>
          )}

          {/* Forgot Password Link - Only for login mode */}
          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !!formError}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {mode === 'login' && 'Signing In...'}
                {mode === 'register' && 'Creating Account...'}
                {mode === 'forgot' && 'Sending Reset Email...'}
              </div>
            ) : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'register' && 'Create Account'}
                {mode === 'forgot' && 'Send Reset Email'}
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Links */}
        {mode !== 'forgot' && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>

        {/* Features Preview - Only for login and register */}
        {mode !== 'forgot' && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-3">With an account you can:</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-red-500">❤️</span>
                <span>Save favorite recipes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">🛒</span>
                <span>Create shopping lists</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">📅</span>
                <span>Plan your meals</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">🔍</span>
                <span>Track search history</span>
              </div>
            </div>
          </div>
        )}

        {/* Forgot Password Info */}
        {mode === 'forgot' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Demo Note:</strong> In a real app, this would send an actual reset email. 
              For demo purposes, use the demo accounts provided.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}