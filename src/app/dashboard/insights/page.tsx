'use client';

import { useState, useEffect } from 'react';
import { Video, Insight } from '@/types';
import { videosApi, insightsApi } from '@/services/api';

export default function InsightsPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await videosApi.getAllVideos();
        setVideos(data);
        if (data.length > 0) {
          setSelectedVideo(data[0]);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  useEffect(() => {
    const fetchInsight = async () => {
      if (!selectedVideo) return;
      
      try {
        const data = await insightsApi.getInsightsForVideo(selectedVideo.id);
        setInsight(data);
      } catch (error) {
        console.error('Error fetching insight:', error);
        setInsight(null);
      }
    };

    fetchInsight();
  }, [selectedVideo]);

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleGenerateInsight = async () => {
    if (!selectedVideo) return;
    
    setIsGenerating(true);
    try {
      const data = await insightsApi.generateInsight(selectedVideo.id, 'viral');
      setInsight(data);
    } catch (error) {
      console.error('Error generating insight:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-center text-xl">Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">AI-Powered Viral Insights</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Video List */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Your Videos</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {videos.length > 0 ? (
              videos.map(video => (
                <div 
                  key={video.id}
                  onClick={() => handleVideoSelect(video)}
                  className={`p-3 rounded-md cursor-pointer ${selectedVideo?.id === video.id ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <h3 className="font-medium truncate">{video.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{new Date(video.publishedAt).toLocaleDateString()}</p>
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    <span>{video.viewCount.toLocaleString()} views</span>
                    <span className="mx-2">•</span>
                    <span>{video.vph.toLocaleString()} VPH</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No videos found.</p>
            )}
          </div>
        </div>
        
        {/* Insight Content */}
        <div className="lg:col-span-3">
          {selectedVideo ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{selectedVideo.title}</h2>
                  <p className="text-gray-500 mt-1">{new Date(selectedVideo.publishedAt).toLocaleDateString()}</p>
                </div>
                {!insight && (
                  <button
                    onClick={handleGenerateInsight}
                    disabled={isGenerating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-indigo-400"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Insights'}
                  </button>
                )}
              </div>
              
              {insight ? (
                <div className="space-y-6">
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <h3 className="font-semibold text-indigo-800 mb-2">AI Summary</h3>
                    <p className="text-gray-800">{insight.summary}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <h3 className="font-semibold text-green-800 mb-2">Strengths</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {insight.details.strengths.map((strength: string, index: number) => (
                          <li key={index} className="text-gray-800">{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <h3 className="font-semibold text-amber-800 mb-2">Improvements</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {insight.details.improvements.map((improvement: string, index: number) => (
                          <li key={index} className="text-gray-800">{improvement}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h3 className="font-semibold text-blue-800 mb-2">Trends</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {insight.details.trends.map((trend: string, index: number) => (
                          <li key={index} className="text-gray-800">{trend}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Recommendations</h3>
                    <p className="text-gray-800">
                      Based on the analysis, consider implementing the improvements suggested above. 
                      Focus on enhancing your thumbnail and adding more interactive elements to increase engagement.
                      Monitor current trends and incorporate them into your content strategy.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No insights available for this video yet.</p>
                  <p className="text-gray-700">Click the "Generate Insights" button to analyze this video with AI.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md text-center py-12">
              <p className="text-gray-500 mb-4">No video selected.</p>
              <p className="text-gray-700">Select a video from the list to view or generate insights.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 