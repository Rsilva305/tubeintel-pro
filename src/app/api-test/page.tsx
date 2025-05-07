'use client';

import { useState, useEffect } from 'react';
import { competitorsApi } from '@/services/api';
import { Competitor } from '@/types';
import ApiModeToggle from '@/components/ApiModeToggle';
import Link from 'next/link';

export default function ApiTestPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchCompetitors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await competitorsApi.getAllCompetitors();
      setCompetitors(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching competitors:', err);
      setError('Failed to load competitors');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCompetitors();
  }, []);
  
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">API Integration Test</h1>
        <ApiModeToggle onChange={() => fetchCompetitors()} />
      </div>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <p>This page tests the API integration with Supabase for competitor tracking. Toggle between Demo and Real mode to see the difference.</p>
      </div>
      
      {error && (
        <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="mb-8">
        <h2 className="text-xl mb-4">Your Competitors</h2>
        
        {loading ? (
          <div className="animate-pulse">Loading competitors...</div>
        ) : competitors.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-lg">
            <p className="text-gray-500">No competitors found</p>
            <p className="text-sm text-gray-400 mt-2">Try adding a competitor in the competitors dashboard</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitors.map(competitor => (
              <div key={competitor.id} className="border rounded-lg p-4 hover:shadow-md transition duration-200">
                <h3 className="font-semibold text-lg">{competitor.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{competitor.youtubeId}</p>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <div className="text-gray-600">Subscribers</div>
                    <div className="font-medium">{competitor.subscriberCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Videos</div>
                    <div className="font-medium">{competitor.videoCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Views</div>
                    <div className="font-medium">{competitor.viewCount.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <Link href="/dashboard/competitors" className="text-indigo-600 hover:text-indigo-800">
          Go to Competitors Dashboard
        </Link>
      </div>
    </div>
  );
} 