'use client';

import { useState, useEffect } from 'react';
import { secureStorage, runSecurityAudit, securityRecommendations } from '@/lib/secure-storage';

export default function SecurityAuditPage() {
  const [auditResults, setAuditResults] = useState<{
    violations: string[];
    recommendations: string[];
  } | null>(null);
  
  const [currentStorage, setCurrentStorage] = useState<{
    localStorage: Array<{key: string, value: string}>;
    sessionStorage: Array<{key: string, value: string}>;
  }>({ localStorage: [], sessionStorage: [] });

  useEffect(() => {
    // Run security audit
    const results = runSecurityAudit();
    setAuditResults(results);

    // Get current storage contents
    if (typeof window !== 'undefined') {
      const localItems: Array<{key: string, value: string}> = [];
      const sessionItems: Array<{key: string, value: string}> = [];

      // Get localStorage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          localItems.push({ 
            key, 
            value: value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : ''
          });
        }
      }

      // Get sessionStorage items
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          sessionItems.push({ 
            key, 
            value: value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : ''
          });
        }
      }

      setCurrentStorage({ localStorage: localItems, sessionStorage: sessionItems });
    }
  }, []);

  const handleCleanup = () => {
    if (confirm('This will remove all sensitive data from localStorage. Continue?')) {
      secureStorage.cleanupSensitiveData();
      // Refresh the audit
      window.location.reload();
    }
  };

  const isRiskyKey = (key: string): boolean => {
    const riskyPatterns = [
      'token', 'refresh_token', 'session', 'password', 'api_key', 'secret',
      'youtube_channel_id', 'email', 'user_id', 'profile'
    ];
    
    return riskyPatterns.some(pattern => 
      key.toLowerCase().includes(pattern)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Security Audit Dashboard
          </h1>
          <p className="text-gray-600">
            Review browser storage security for your SaaS application
          </p>
        </div>

        {/* Audit Results */}
        {auditResults && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Violations */}
            <div className={`p-6 rounded-lg shadow ${
              auditResults.violations.length > 0 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-green-50 border border-green-200'
            }`}>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                {auditResults.violations.length > 0 ? (
                  <>
                    <span className="text-red-600">⚠️ Security Violations</span>
                    <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                      {auditResults.violations.length}
                    </span>
                  </>
                ) : (
                  <span className="text-green-600">✅ No Violations Found</span>
                )}
              </h2>
              
              {auditResults.violations.length > 0 ? (
                <div className="space-y-2">
                  {auditResults.violations.map((violation, index) => (
                    <div key={index} className="text-red-700 text-sm">
                      • {violation}
                    </div>
                  ))}
                  <button
                    onClick={handleCleanup}
                    className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    🧹 Clean Up Sensitive Data
                  </button>
                </div>
              ) : (
                <p className="text-green-700">
                  Your application follows secure storage practices!
                </p>
              )}
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                💡 Security Recommendations
              </h2>
              
              {auditResults.recommendations.length > 0 ? (
                <div className="space-y-2">
                  {auditResults.recommendations.map((rec, index) => (
                    <div key={index} className="text-blue-700 text-sm">
                      • {rec}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-blue-700">
                  No immediate security improvements needed.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Current Storage Contents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* localStorage */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              localStorage Contents ({currentStorage.localStorage.length} items)
            </h3>
            
            {currentStorage.localStorage.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentStorage.localStorage.map((item, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded border ${
                      isRiskyKey(item.key) 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-mono text-sm">
                      <span className={`font-semibold ${
                        isRiskyKey(item.key) ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        {item.key}
                      </span>
                      {isRiskyKey(item.key) && (
                        <span className="ml-2 bg-red-100 text-red-800 px-1 py-0.5 rounded text-xs">
                          RISKY
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 break-all">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No localStorage items found</p>
            )}
          </div>

          {/* sessionStorage */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              sessionStorage Contents ({currentStorage.sessionStorage.length} items)
            </h3>
            
            {currentStorage.sessionStorage.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentStorage.sessionStorage.map((item, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded border ${
                      isRiskyKey(item.key) 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-mono text-sm">
                      <span className={`font-semibold ${
                        isRiskyKey(item.key) ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        {item.key}
                      </span>
                      {isRiskyKey(item.key) && (
                        <span className="ml-2 bg-red-100 text-red-800 px-1 py-0.5 rounded text-xs">
                          RISKY
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 break-all">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No sessionStorage items found</p>
            )}
          </div>
        </div>

        {/* Security Best Practices */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔒 Security Best Practices for SaaS
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-green-600 mb-2">✅ Safe to Store</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• UI preferences (theme, language)</li>
                <li>• Non-sensitive settings</li>
                <li>• Cache timestamps</li>
                <li>• Anonymous analytics</li>
                <li>• Feature flags</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-yellow-600 mb-2">⚠️ Use with Caution</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Form drafts (non-sensitive)</li>
                <li>• Temporary UI state</li>
                <li>• Navigation state</li>
                <li>• Public configuration</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-red-600 mb-2">❌ Never Store</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Passwords or tokens</li>
                <li>• API keys or secrets</li>
                <li>• Personal information (PII)</li>
                <li>• Business sensitive data</li>
                <li>• Payment information</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Implementation Guide */}
        <div className="bg-gray-900 text-white p-6 rounded-lg shadow mt-6">
          <h3 className="text-lg font-semibold mb-4">
            🛠️ Implementation Recommendations
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-blue-300 mb-2">1. Authentication</h4>
              <ul className="text-sm space-y-1 ml-4">
                {securityRecommendations.authentication.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-300 mb-2">2. Data Storage</h4>
              <ul className="text-sm space-y-1 ml-4">
                {securityRecommendations.dataStorage.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-purple-300 mb-2">3. Implementation</h4>
              <ul className="text-sm space-y-1 ml-4">
                {securityRecommendations.implementation.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 