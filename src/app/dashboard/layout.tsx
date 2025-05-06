'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated } from '@/lib/supabase';
import NavigationWrapper from '@/components/NavigationWrapper';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on component mount
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        if (!authenticated) {
          // Not authenticated, redirect to login
          console.log('Not authenticated, redirecting to login');
          router.push('/login');
          return;
        }
        
        // Get the current user
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          // No user found, redirect to login
          console.log('No user found, redirecting to login');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  return <NavigationWrapper>{children}</NavigationWrapper>;
} 