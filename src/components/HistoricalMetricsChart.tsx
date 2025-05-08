import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Types
type MetricType = 'view_count' | 'like_count' | 'comment_count' | 'vph' | 'subscriber_count';
type TimeSpan = '7d' | '30d' | '90d';

// Define types for our database records
interface VideoMetricsRecord {
  recorded_at: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  vph?: number;
}

interface ChannelMetricsRecord {
  recorded_at: string;
  total_views?: number;
  total_likes?: number;
  subscriber_count?: number;
  video_count?: number;
}

interface HistoricalMetricsChartProps {
  channelId?: string;
  videoId?: string;
  metric: MetricType;
  timeSpan: TimeSpan;
  title: string;
  height?: number;
}

export default function HistoricalMetricsChart({
  channelId,
  videoId,
  metric,
  timeSpan,
  title,
  height = 300
}: HistoricalMetricsChartProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistoricalData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Calculate date range based on timeSpan
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeSpan) {
          case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        }
        
        // Build the query based on whether we're looking at channel or video metrics
        let metricsData: any[] = [];
        let queryError = null;
        
        if (videoId) {
          const response = await supabase
            .from('video_metrics_history')
            .select('recorded_at, ' + metric)
            .eq('user_id', user.id)
            .eq('video_id', videoId)
            .gte('recorded_at', startDate.toISOString())
            .lte('recorded_at', endDate.toISOString())
            .order('recorded_at', { ascending: true });
            
          metricsData = response.data || [];
          queryError = response.error;
        } else if (channelId) {
          // For channel metrics, we need to map the metric name to the channel table column
          const channelMetricMap: Record<MetricType, string> = {
            view_count: 'total_views',
            like_count: 'total_likes',
            subscriber_count: 'subscriber_count',
            vph: 'total_views', // Not directly stored, but we could calculate
            comment_count: 'total_views' // Not directly stored
          };
          
          const channelMetric = channelMetricMap[metric];
          
          const response = await supabase
            .from('channel_metrics_history')
            .select('recorded_at, ' + channelMetric)
            .eq('user_id', user.id)
            .eq('channel_id', channelId)
            .gte('recorded_at', startDate.toISOString())
            .lte('recorded_at', endDate.toISOString())
            .order('recorded_at', { ascending: true });
            
          metricsData = response.data || [];
          queryError = response.error;
        } else {
          throw new Error('Either channelId or videoId must be provided');
        }
        
        if (queryError) {
          throw queryError;
        }
        
        if (!metricsData || metricsData.length === 0) {
          setChartData({
            labels: [],
            datasets: [{
              label: formatMetricLabel(metric),
              data: [],
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.4
            }]
          });
          setIsLoading(false);
          return;
        }
        
        // Format data for the chart
        const labels = metricsData.map(item => 
          new Date(item.recorded_at).toLocaleDateString()
        );
        
        const metricValues = metricsData.map(item => {
          // Get the appropriate metric value
          if (videoId) {
            return item[metric] || 0;
          } else if (channelId) {
            // Map channel table columns to metrics
            switch (metric) {
              case 'view_count': 
                return item.total_views || 0;
              case 'subscriber_count':
                return item.subscriber_count || 0;
              case 'like_count':
                return item.total_likes || 0;
              default:
                return 0;
            }
          }
          return 0;
        });
        
        setChartData({
          labels,
          datasets: [{
            label: formatMetricLabel(metric),
            data: metricValues,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4
          }]
        });
      } catch (error: any) {
        console.error('Error fetching historical metrics:', error);
        setError(error.message || 'Failed to load historical data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchHistoricalData();
  }, [channelId, videoId, metric, timeSpan]);
  
  // Helper function to format metric labels
  const formatMetricLabel = (metric: MetricType): string => {
    switch (metric) {
      case 'view_count':
        return 'Views';
      case 'like_count':
        return 'Likes';
      case 'comment_count':
        return 'Comments';
      case 'vph':
        return 'Views Per Hour';
      case 'subscriber_count':
        return 'Subscribers';
      default:
        return 'Value';
    }
  };
  
  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p>Loading historical data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }
  
  if (!chartData || chartData.labels.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p>No historical data available yet. As you use TubeIntel Pro, we'll collect data daily to build this chart.</p>
      </div>
    );
  }
  
  return (
    <div style={{ height }}>
      <Line options={options} data={chartData} />
    </div>
  );
} 