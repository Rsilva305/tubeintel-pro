'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Channel } from '@/types';
import { channelsApi } from '@/services/api';

interface ChannelContextType {
  channel: Channel | null;
  isLoading: boolean;
  error: string | null;
  refreshChannel: () => Promise<void>;
  setChannel: (channel: Channel | null) => void;
}

const ChannelContext = createContext<ChannelContextType | undefined>(undefined);

interface ChannelProviderProps {
  children: ReactNode;
}

export function ChannelProvider({ children }: ChannelProviderProps) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannel = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const channelData = await channelsApi.getMyChannel();
      setChannel(channelData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch channel';
      setError(errorMessage);
      setChannel(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshChannel = async () => {
    await fetchChannel();
  };

  useEffect(() => {
    fetchChannel();
  }, []);

  const value: ChannelContextType = {
    channel,
    isLoading,
    error,
    refreshChannel,
    setChannel,
  };

  return (
    <ChannelContext.Provider value={value}>
      {children}
    </ChannelContext.Provider>
  );
}

export function useChannel() {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error('useChannel must be used within a ChannelProvider');
  }
  return context;
} 