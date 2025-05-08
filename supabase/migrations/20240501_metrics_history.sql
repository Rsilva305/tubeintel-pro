-- Video metrics history table for tracking daily stats
CREATE TABLE video_metrics_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  video_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  view_count INTEGER NOT NULL,
  like_count INTEGER NOT NULL,
  comment_count INTEGER NOT NULL,
  vph INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(video_id, user_id, recorded_date)
);

-- Add indexes for efficient querying
CREATE INDEX idx_video_metrics_video_date ON video_metrics_history(video_id, recorded_at);
CREATE INDEX idx_video_metrics_user_date ON video_metrics_history(user_id, recorded_at);
CREATE INDEX idx_video_metrics_channel ON video_metrics_history(channel_id);

-- Channel metrics history table for overall channel stats
CREATE TABLE channel_metrics_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  channel_id TEXT NOT NULL,
  total_views INTEGER NOT NULL,
  total_likes INTEGER NOT NULL,
  subscriber_count INTEGER NOT NULL,
  video_count INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(channel_id, user_id, recorded_date)
);

-- Add indexes for efficient querying
CREATE INDEX idx_channel_metrics_channel_date ON channel_metrics_history(channel_id, recorded_at);
CREATE INDEX idx_channel_metrics_user_date ON channel_metrics_history(user_id, recorded_at);

-- Add RLS policies to ensure users can only access their own data
ALTER TABLE video_metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_metrics_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video metrics"
  ON video_metrics_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video metrics"
  ON video_metrics_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own channel metrics"
  ON channel_metrics_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own channel metrics"
  ON channel_metrics_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);