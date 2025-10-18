'use client';

import { useState, useEffect } from 'react';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

interface GeocodeStats {
  stats?: {
    total_jobs?: number;
    jobs_with_coordinates?: number;
    jobs_without_coordinates?: number;
    geocoding_completion?: string;
  };
}

interface GeocodeResult {
  id: string;
  location: string;
  status: string;
  coordinates?: [number, number];
}

interface GeocodeResults {
  stats?: {
    processed: number;
    updated: number;
    errors: number;
    success_rate: string;
  };
  results?: GeocodeResult[];
  error?: string;
  details?: string;
}

export default function GeocodePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [stats, setStats] = useState<GeocodeStats | null>(null);
  const [results, setResults] = useState<GeocodeResults | null>(null);

  const checkStats = async () => {
    try {
      const response = await fetch('/api/jobs/geocode-existing');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const runBulkGeocode = async () => {
    setStatus('loading');
    setResults(null);
    
    try {
      const response = await fetch('/api/jobs/geocode-existing', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setResults(data);
        // Refresh stats after completion
        await checkStats();
      } else {
        setStatus('error');
        setResults(data);
      }
    } catch (error) {
      setStatus('error');
      setResults({ error: 'Network error', details: error instanceof Error ? error.message : String(error) });
    }
  };

  // Load stats on component mount
  useEffect(() => {
    checkStats();
   
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🗺️ Bulk Job Geocoding
          </h1>
          
          <p className="text-gray-600 mb-6">
            This tool will geocode all existing jobs in the database that don't have coordinates yet.
            It respects LocationIQ rate limits with 600ms delays between requests.
          </p>

          {/* Current Stats */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-3">Current Database Stats</h2>
            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-blue-700">Total Jobs</div>
                  <div className="text-xl">{stats.stats?.total_jobs || 0}</div>
                </div>
                <div>
                  <div className="font-medium text-green-700">With Coordinates</div>
                  <div className="text-xl">{stats.stats?.jobs_with_coordinates || 0}</div>
                </div>
                <div>
                  <div className="font-medium text-orange-700">Without Coordinates</div>
                  <div className="text-xl">{stats.stats?.jobs_without_coordinates || 0}</div>
                </div>
                <div>
                  <div className="font-medium text-purple-700">Completion Rate</div>
                  <div className="text-xl">{stats.stats?.geocoding_completion || '0%'}</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Loading stats...</div>
            )}
            <button
              onClick={checkStats}
              className="mt-3 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Refresh Stats
            </button>
          </div>

          {/* Action Button */}
          <div className="mb-6">
            <button
              onClick={runBulkGeocode}
              disabled={status === 'loading'}
              className={`px-6 py-3 rounded-lg font-medium text-white ${
                status === 'loading'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Start Bulk Geocoding'
              )}
            </button>
            
            {status === 'loading' && (
              <p className="text-sm text-gray-600 mt-2">
                This may take several minutes depending on the number of jobs. Please don't close this page.
              </p>
            )}
          </div>

          {/* Results */}
          {results && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">
                {status === 'success' ? '✅ Results' : '❌ Error'}
              </h2>
              
              {status === 'success' && results.stats && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-green-700">Processed</div>
                      <div className="text-lg">{results.stats.processed}</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-700">Updated</div>
                      <div className="text-lg">{results.stats.updated}</div>
                    </div>
                    <div>
                      <div className="font-medium text-red-700">Errors</div>
                      <div className="text-lg">{results.stats.errors}</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-700">Success Rate</div>
                      <div className="text-lg">{results.stats.success_rate}</div>
                    </div>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-red-800">
                    <strong>Error:</strong> {results.error || 'Unknown error'}
                  </div>
                  {results.details && (
                    <div className="text-red-700 text-sm mt-1">
                      {results.details}
                    </div>
                  )}
                </div>
              )}

              {results.results && Array.isArray(results.results) && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Detailed Results ({results.results.length} jobs)</h3>
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">Job ID</th>
                          <th className="px-3 py-2 text-left">Location</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Coordinates</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {results.results.map((result, index) => (
                          <tr key={index} className={
                            result.status === 'success' ? 'bg-green-50' :
                            result.status === 'error' ? 'bg-red-50' :
                            result.status === 'skipped_remote' ? 'bg-blue-50' :
                            'bg-gray-50'
                          }>
                            <td className="px-3 py-2 font-mono">{result.id}</td>
                            <td className="px-3 py-2">{result.location}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                result.status === 'success' ? 'bg-green-100 text-green-800' :
                                result.status === 'error' ? 'bg-red-100 text-red-800' :
                                result.status === 'skipped_remote' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {result.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono">
                              {result.coordinates ? 
                                `[${result.coordinates[0]}, ${result.coordinates[1]}]` : 
                                '-'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}