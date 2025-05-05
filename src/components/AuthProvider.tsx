'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser } from '@/lib/supabase';

// Define auth context types
type User = {
  id: string;
  email?: string;
  username?: string;
} | null;

type AuthContextType = {
  user: User;
  isLoading: boolean;
  isDemo: boolean;
};

// Create context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isDemo: false,
});

// Auth Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Function to get the current user
    async function getUser() {
      try {
        // First check for demo user in localStorage
        const localUser = localStorage.getItem('user');
        if (localUser) {
          setUser(JSON.parse(localUser));
          setIsDemo(true);
          setIsLoading(false);
          return;
        }

        // Otherwise check for real auth
        const currentUser = await getCurrentUser();
        setUser(currentUser || null);
        setIsDemo(false);
      } catch (error) {
        console.error('Error getting user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    // Get initial user
    getUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          setIsDemo(false);
        } else if (!localStorage.getItem('user')) {
          setUser(null);
        }
      }
    );

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export const useAuth = () => useContext(AuthContext); 