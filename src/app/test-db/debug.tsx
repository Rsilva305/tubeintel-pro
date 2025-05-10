'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase';
import { getUseRealApi, useRealApiForCompetitors } from '@/services/api/config';

export default function DebugComponent() {
  const [apiState, setApiState] = useState({
    useRealApi: false,
    useRealApiForCompetitors: false,
    userInfo: null,
    path: ''
  });
  
  useEffect(() => {
    const checkState = async () => {
      const user = await getCurrentUser();
      
      setApiState({
        useRealApi: getUseRealApi(),
        useRealApiForCompetitors: useRealApiForCompetitors(),
        userInfo: user,
        path: window.location.pathname
      });
    };
    
    checkState();
  }, []);
  
  return (
    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
      <h2 className="text-lg font-bold mb-4">API Debug Information</h2>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="font-medium">Current Path:</div>
        <div>{apiState.path}</div>
        
        <div className="font-medium">useRealApi:</div>
        <div>{apiState.useRealApi ? 'TRUE' : 'FALSE'}</div>
        
        <div className="font-medium">useRealApiForCompetitors:</div>
        <div>{apiState.useRealApiForCompetitors ? 'TRUE' : 'FALSE'}</div>
        
        <div className="font-medium">User Authenticated:</div>
        <div>{apiState.userInfo ? 'YES' : 'NO'}</div>
      </div>
      
      {apiState.userInfo && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">User Info:</h3>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(apiState.userInfo, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4">
        <button 
          onClick={async () => {
            try {
              // Test direct Supabase connection
              const { data, error } = await supabase
                .from('competitor_lists')
                .select('count')
                .limit(1);
                
              alert(error ? `Error: ${error.message}` : `Success! Found ${data.length} lists`);
            } catch (e: any) {
              alert(`Exception: ${e.message}`);
            }
          }}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Test Supabase Connection
        </button>
      </div>
    </div>
  );
} 