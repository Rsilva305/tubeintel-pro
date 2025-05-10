'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, signIn, signOut } from '@/lib/supabase';

export default function SupabaseTest() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const checkAuth = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setMessage(currentUser ? 'User is authenticated' : 'Not authenticated');
    } catch (err: any) {
      setMessage(`Auth check error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignIn = async () => {
    if (!email || !password) {
      setMessage('Please enter email and password');
      return;
    }
    
    setLoading(true);
    try {
      const result = await signIn(email, password);
      setUser(result.user);
      setMessage('Successfully signed in');
    } catch (err: any) {
      setMessage(`Sign in error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      setUser(null);
      setMessage('Signed out');
    } catch (err: any) {
      setMessage(`Sign out error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const testSupabaseConnection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('count');
      
      if (error) {
        setMessage(`Supabase error: ${error.message}`);
      } else {
        setMessage(`Successfully connected to Supabase! Data: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      setMessage(`Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mt-8 p-4 bg-blue-50 rounded-lg">
      <h2 className="text-lg font-bold mb-4">Supabase Authentication Test</h2>
      
      <div className="space-y-4 mb-4">
        <button 
          onClick={checkAuth}
          disabled={loading}
          className="bg-blue-500 text-white px-3 py-1 rounded mr-2 disabled:bg-gray-300"
        >
          Check Authentication
        </button>
        
        <button 
          onClick={testSupabaseConnection}
          disabled={loading}
          className="bg-green-500 text-white px-3 py-1 rounded disabled:bg-gray-300"
        >
          Test Supabase Connection
        </button>
      </div>
      
      {!user && (
        <div className="mt-4 space-y-2">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-2 border rounded"
            />
          </div>
          <button 
            onClick={handleSignIn}
            disabled={loading}
            className="bg-indigo-500 text-white px-3 py-1 rounded disabled:bg-gray-300"
          >
            Sign In
          </button>
        </div>
      )}
      
      {user && (
        <div className="mt-4">
          <div className="mb-2">
            <span className="font-medium">Logged in as:</span> {user.email}
          </div>
          <button 
            onClick={handleSignOut}
            disabled={loading}
            className="bg-red-500 text-white px-3 py-1 rounded disabled:bg-gray-300"
          >
            Sign Out
          </button>
        </div>
      )}
      
      {message && (
        <div className={`mt-4 p-2 rounded ${
          message.includes('error') || message.includes('Error') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}
      
      {user && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">User Data:</h3>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 