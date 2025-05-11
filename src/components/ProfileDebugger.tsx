'use client';

import { useState } from 'react';
import { checkProfile, resetProfile, bypassSecurityProfileUpdate } from '@/lib/profile-reset';
import { getCurrentUser } from '@/lib/supabase';

export default function ProfileDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [channelId, setChannelId] = useState('');

  const handleCheck = async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        setResults({ error: 'No user logged in' });
        return;
      }
      
      const checkResults = await checkProfile(user.id);
      setResults(checkResults);
    } catch (error) {
      setResults({ error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset your profile? This will clear your channel connection.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        setResults({ error: 'No user logged in' });
        return;
      }
      
      const resetResults = await resetProfile(user.id);
      setResults(resetResults);
      
      if (resetResults.success) {
        alert('Profile reset successful! Please refresh the page.');
      }
    } catch (error) {
      setResults({ error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBypass = async () => {
    if (!channelId) {
      alert('Please enter a YouTube channel ID to connect');
      return;
    }
    
    if (!confirm('This will bypass security to update your profile. Are you sure?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        setResults({ error: 'No user logged in' });
        return;
      }
      
      const bypassResults = await bypassSecurityProfileUpdate(user.id, channelId);
      setResults(bypassResults);
      
      if (bypassResults.success) {
        alert('Profile updated successfully! Please refresh the page.');
      }
    } catch (error) {
      setResults({ error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mt-2"
      >
        Debug Profile Issues
      </button>
    );
  }

  return (
    <div className="mt-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Profile Debugger</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Close
        </button>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          The error "Failed to update profile: new row violates row-level security policy for table 'profiles'" 
          occurs when the database security policies prevent you from updating your profile.
        </p>
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">QUICK FIX:</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
            1. Run the SQL fix in your Supabase dashboard to add missing security policies.
          </p>
          <a
            href="/src/lib/profile-fix.sql"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded"
          >
            View SQL Fix
          </a>
          <button
            onClick={() => {
              // Open the helper script 
              window.open('fix-profiles.bat', '_blank');
            }}
            className="mt-2 ml-2 inline-block px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded"
          >
            Open Helper Script
          </button>
        </div>
      </div>
      
      <div className="flex space-x-2 mb-4">
        <button
          onClick={handleCheck}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Check Profile
        </button>
        
        <button
          onClick={handleReset}
          disabled={isLoading}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Reset Profile
        </button>
      </div>
      
      <div className="mt-4 mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="font-medium mb-2">Emergency Bypass (Use Only If Other Methods Fail)</h4>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="Enter YouTube Channel ID"
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded w-full"
          />
          <button
            onClick={handleBypass}
            disabled={isLoading || !channelId}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            Bypass Security
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Note: This requires the backend API routes to be properly set up with a service role key.
        </p>
      </div>
      
      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
      
      {results && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Results:</h4>
          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-80">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 