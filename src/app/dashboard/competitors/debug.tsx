'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealApiForCompetitors } from '@/services/api/config';

export default function CompetitorsDebug({ onLogin }: { onLogin?: () => void }) {
  const [supabaseAuth, setSupabaseAuth] = useState<any>(null);
  const [localUser, setLocalUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check Supabase authentication
        const { data } = await supabase.auth.getUser();
        setSupabaseAuth(data.user);
        
        // Check localStorage user
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setLocalUser(JSON.parse(storedUser));
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    
    checkAuth();
  }, []);
  
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        setError(signInError.message);
        return;
      }
      
      // Update user state
      setSupabaseAuth(data.user);
      
      // Store user in localStorage (with basic info)
      if (data.user) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.email?.split('@')[0] || 'user'
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setLocalUser(userData);
      }
      
      // Notify parent component if provided
      if (onLogin) {
        onLogin();
      }
      
      // Refresh the page to ensure everything is using the latest auth state
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (!showDebug) {
    if (supabaseAuth) return null; // Authenticated, don't show anything
    
    return (
      <div className="bg-yellow-50 p-4 rounded-lg mb-4 border border-yellow-200">
        <p className="font-medium">Authentication Issue Detected</p>
        <p className="text-sm text-gray-700 mb-2">
          You appear to be logged in, but Supabase authentication is missing, which may prevent saving competitor lists.
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDebug(true)}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
          >
            Fix Authentication
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg mb-4 shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">Authentication Debugger</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-xs text-gray-500"
        >
          Hide
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 p-2 rounded mb-4 text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <div className="mb-2">
          <span className="text-sm font-medium">Supabase Auth:</span>
          <span className="ml-2 text-sm">
            {supabaseAuth ? 'Authenticated ✅' : 'Not authenticated ❌'}
          </span>
        </div>
        
        <div className="mb-2">
          <span className="text-sm font-medium">Local Storage User:</span>
          <span className="ml-2 text-sm">
            {localUser ? 'Present ✅' : 'Not present ❌'}
          </span>
        </div>
      </div>
      
      {!supabaseAuth && (
        <div className="border-t pt-3">
          <p className="text-sm mb-2 font-medium">Sign in to fix authentication issues:</p>
          
          <div className="mb-2">
            <label className="block text-xs mb-1">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-1 border rounded text-sm"
              disabled={loading}
            />
          </div>
          
          <div className="mb-2">
            <label className="block text-xs mb-1">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-1 border rounded text-sm"
              disabled={loading}
            />
          </div>
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-1 rounded text-sm disabled:bg-gray-300"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      )}
      
      {supabaseAuth && (
        <div className="mt-3 text-xs">
          <p className="font-medium">Auth Details:</p>
          <pre className="bg-gray-50 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(supabaseAuth, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 