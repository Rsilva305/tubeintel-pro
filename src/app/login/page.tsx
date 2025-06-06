'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaYoutube } from 'react-icons/fa';
import Link from 'next/link';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

// Define interface for the extended sign-in result
interface SignInResult {
  user: any;
  session: any;
  hasCompletedOnboarding?: boolean;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  
  // Get redirect URL if present
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  // Check if user is already logged in using AuthContext
  useEffect(() => {
    // Wait for auth context to finish loading
    if (authLoading) return;
    
    if (isAuthenticated && user) {
      // User is already logged in, check onboarding status
      console.log('User already authenticated:', user);
      
      // Check if there's a redirectTo parameter to use instead
      if (redirectTo && redirectTo !== '/dashboard') {
        router.push(redirectTo);
        return;
      }
      
             // Use the hasCompletedOnboarding from the secure user object
       if ((user as any).hasCompletedOnboarding) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }
  }, [router, redirectTo, isAuthenticated, user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use AuthContext login method for consistency
      await login(email, password);
      
      console.log('Login successful via AuthContext');
      
      // The useEffect will handle the redirect based on AuthContext state
      // No need to manually redirect here since the AuthContext will update
      // and trigger the useEffect that handles routing
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <FaYoutube className="text-red-500 text-4xl mr-2" />
            <h1 className="text-3xl font-bold dark:text-white">TubeIntel Pro</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Your YouTube Analytics Dashboard</p>
        </div>
        
        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-center dark:text-white">Sign In</h2>
          </div>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-4">
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Don't have an account? <Link href="/signup" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 