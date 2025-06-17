import { Video } from '@/types';
import { secureYoutubeService } from './youtube-secure';
import { videosStorageApi } from './videos';

// Simple in-memory lock to prevent concurrent sync operations
const syncLocks = new Set<string>();

export interface SmartSyncResult {
  videos: Video[];
  fromCache: number;
  fromApi: number;
  errors: string[];
}

export const smartVideoSync = {
  // Smart sync for multiple channels - uses cache first, then API for updates
  syncChannelsVideos: async (
    channelIds: string[],
    videosPerChannel?: number, // undefined means no limit
    forceRefresh = false
  ): Promise<SmartSyncResult> => {
    console.log('\n🧠 === SMART VIDEO SYNC STARTED ===');
    console.log(`📋 Channels: ${channelIds.length}`);
    console.log(`🎯 Target per channel: ${videosPerChannel === undefined || videosPerChannel === 0 ? 'ALL videos (no limit)' : videosPerChannel}`);
    console.log(`🔄 Force refresh: ${forceRefresh}`);
    
    const result: SmartSyncResult = {
      videos: [],
      fromCache: 0,
      fromApi: 0,
      errors: []
    };

    try {
      // Step 1: Get stored videos for all channels
      const storedVideos = await videosStorageApi.getStoredVideosForChannels(
        channelIds, 
        videosPerChannel === 0 ? undefined : videosPerChannel // Convert 0 to undefined for storage API
      );
      
      console.log(`💾 Found ${storedVideos.length} stored videos`);
      
      // Group stored videos by channel
      const videosByChannel = storedVideos.reduce((acc, video) => {
        if (!acc[video.channelId]) acc[video.channelId] = [];
        acc[video.channelId].push(video);
        return acc;
      }, {} as Record<string, Video[]>);

      // Step 2: Process each channel individually
      for (const channelId of channelIds) {
        try {
          console.log(`\n📺 Processing channel: ${channelId}`);
          
          // Check if this channel is already being synced
          if (syncLocks.has(channelId)) {
            console.log(`🔒 Channel ${channelId} is already being synced, skipping...`);
            continue;
          }
          
          // Acquire lock for this channel
          syncLocks.add(channelId);
          
          const channelStoredVideos = videosByChannel[channelId] || [];
          console.log(`💾 Stored videos for this channel: ${channelStoredVideos.length}`);
          
          // Check if we need to fetch new videos
          const needsSync = forceRefresh || await videosStorageApi.needsSync(channelId, 30);
          
          // If no limit is specified (undefined or 0), always do a full sync to get all videos
          const shouldFullSync = videosPerChannel === undefined || videosPerChannel === 0 || forceRefresh;
          
          if (!needsSync && !shouldFullSync && videosPerChannel && videosPerChannel > 0 && channelStoredVideos.length >= videosPerChannel) {
            // Use stored videos only (when there's a specific limit and we have enough cached)
            console.log(`✅ Using cached videos (sufficient and recent)`);
            const videosToUse = channelStoredVideos.slice(0, videosPerChannel);
            result.videos.push(...videosToUse);
            result.fromCache += videosToUse.length;
            continue;
          }

          // Determine sync type based on stored videos and limit
          const isInitialSync = channelStoredVideos.length === 0;
          const syncType = shouldFullSync ? 'FULL (fetch ALL videos)' : 
                          isInitialSync ? 'INITIAL (fetch ALL videos)' : 'UPDATE (fetch recent videos)';
          console.log(`🔍 Sync type: ${syncType}`);

          let freshVideos: Video[] = [];
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount <= maxRetries) {
            try {
              if (retryCount > 0) {
                const delay = 5000 * Math.pow(2, retryCount - 1);
                console.log(`⏳ Retry ${retryCount}/${maxRetries} - waiting ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }

              if (shouldFullSync || isInitialSync) {
                // FULL SYNC: Fetch ALL videos from the channel
                console.log(`🚀 FULL SYNC: Fetching ALL videos for channel ${channelId}...`);
                console.log(`⚠️ This may take several minutes for channels with many videos`);
                
                // Use the new getAllVideosByChannelId method with progress tracking
                freshVideos = await secureYoutubeService.getAllVideosByChannelId(
                  channelId,
                  (current, total) => {
                    if (total) {
                      const percentage = Math.round((current / total) * 100);
                      console.log(`📊 Progress: ${current}/${total} videos (${percentage}%)`);
                    } else {
                      console.log(`📊 Progress: ${current} videos fetched...`);
                    }
                  }
                );
                
                console.log(`🎉 FULL SYNC COMPLETE: Retrieved ${freshVideos.length} total videos for channel ${channelId}`);
                
              } else {
                // UPDATE SYNC: Fetch recent videos only
                console.log(`🔄 UPDATE SYNC: Fetching recent videos for channel ${channelId}...`);
                // Fixed: Don't default to 50 when videosPerChannel is 0/undefined
                const fetchCount = videosPerChannel && videosPerChannel > 0 ? Math.min(50, videosPerChannel * 2) : 50;
                console.log(`📊 Fetching up to ${fetchCount} recent videos for update sync`);
                freshVideos = await secureYoutubeService.getVideosByChannelId(channelId, fetchCount);
                console.log(`✅ UPDATE SYNC: Retrieved ${freshVideos.length} recent videos`);
              }
              
              break;
              
            } catch (error: any) {
              retryCount++;
              console.error(`❌ API error (attempt ${retryCount}):`, error.message);
              
              if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
                if (retryCount <= maxRetries) {
                  console.log(`🚫 Rate limited, will retry...`);
                  continue;
                }
              }
              
              if (retryCount > maxRetries) {
                const errorMsg = `Failed to fetch videos for channel ${channelId} after ${maxRetries} retries`;
                result.errors.push(errorMsg);
                console.error(`💀 ${errorMsg}`);
                break;
              }
            }
          }

          // If API failed, fall back to stored videos
          if (freshVideos.length === 0 && channelStoredVideos.length > 0) {
            console.log(`⚠️ API failed, using ${channelStoredVideos.length} stored videos as fallback`);
            const videosToUse = (videosPerChannel && videosPerChannel > 0) ? 
              channelStoredVideos.slice(0, videosPerChannel) : channelStoredVideos;
            result.videos.push(...videosToUse);
            result.fromCache += videosToUse.length;
            continue;
          }

          // Store fresh videos in database
          if (freshVideos.length > 0) {
            try {
              console.log(`💾 Storing ${freshVideos.length} videos in database...`);
              await videosStorageApi.storeVideos(freshVideos);
              
              // Update sync status
              const latestVideo = freshVideos.sort((a, b) => 
                new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
              )[0];
              
              await videosStorageApi.updateChannelSyncStatus(
                channelId,
                freshVideos.length,
                latestVideo?.publishedAt || null
              );
              
              console.log(`✅ Successfully stored ${freshVideos.length} videos in database`);
            } catch (storeError) {
              console.error(`❌ Error storing videos:`, storeError);
              result.errors.push(`Failed to store videos for channel ${channelId}`);
            }
          }

          // Combine fresh and stored videos, prioritizing fresh
          const combinedVideos = [
            ...freshVideos,
            ...channelStoredVideos.filter(stored => 
              !freshVideos.some(fresh => fresh.youtubeId === stored.youtubeId)
            )
          ];

          // Additional deduplication step to ensure no duplicates
          const uniqueCombinedVideos = combinedVideos.reduce((acc, video) => {
            if (!acc.some(existing => existing.youtubeId === video.youtubeId)) {
              acc.push(video);
            }
            return acc;
          }, [] as Video[]);

          // Sort by date and take the requested amount (or all if no limit)
          const sortedVideos = uniqueCombinedVideos
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          
          // Fixed: Handle unlimited videos properly
          const finalVideos = (videosPerChannel && videosPerChannel > 0) ? 
            sortedVideos.slice(0, videosPerChannel) : sortedVideos;

          result.videos.push(...finalVideos);
          result.fromApi += freshVideos.length;
          
          const cacheCount = finalVideos.length - freshVideos.length;
          if (cacheCount > 0) {
            result.fromCache += cacheCount;
          }

          console.log(`📊 Added ${finalVideos.length} videos (${freshVideos.length} fresh + ${cacheCount} cached)`);

          // Rate limiting: wait between channels
          if (channelIds.indexOf(channelId) < channelIds.length - 1) {
            console.log(`⏳ Waiting 5s before next channel...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }

        } catch (channelError) {
          console.error(`💥 Error processing channel ${channelId}:`, channelError);
          result.errors.push(`Error processing channel ${channelId}: ${channelError}`);
        } finally {
          // Release lock for this channel
          syncLocks.delete(channelId);
        }
      }

      // Final sort by date across all channels
      result.videos.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      console.log('\n📊 === SMART SYNC COMPLETE ===');
      console.log(`✅ Total videos: ${result.videos.length}`);
      console.log(`💾 From cache: ${result.fromCache}`);
      console.log(`🌐 From API: ${result.fromApi}`);
      console.log(`❌ Errors: ${result.errors.length}`);
      
      if (result.errors.length > 0) {
        console.log(`⚠️ Errors encountered:`, result.errors);
      }

      return result;

    } catch (error) {
      console.error('💥 Fatal error in smart sync:', error);
      result.errors.push(`Fatal sync error: ${error}`);
      return result;
    }
  },

  // Background sync for all tracked channels (used by cron job)
  backgroundSyncAllChannels: async (): Promise<void> => {
    console.log('\n🔄 === BACKGROUND SYNC STARTED ===');
    
    try {
      // Get all channels that need syncing
      const channelsToSync = await videosStorageApi.getChannelsNeedingSync(30);
      
      if (channelsToSync.length === 0) {
        console.log('✅ No channels need syncing at this time');
        return;
      }

      console.log(`📋 Syncing ${channelsToSync.length} channels in background`);

      // Process channels in smaller batches to avoid overwhelming the API
      const BATCH_SIZE = 1; // Reduced to 1 for full sync operations
      const BATCH_DELAY = 30000; // 30 seconds between batches for full syncs

      for (let i = 0; i < channelsToSync.length; i += BATCH_SIZE) {
        const batch = channelsToSync.slice(i, i + BATCH_SIZE);
        console.log(`\n📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(channelsToSync.length/BATCH_SIZE)}`);
        
        // For background sync, use conservative fetch counts
        const result = await smartVideoSync.syncChannelsVideos(batch, 25, false);
        
        console.log(`✅ Batch complete: ${result.videos.length} videos, ${result.errors.length} errors`);

        // Wait between batches (except for the last one)
        if (i + BATCH_SIZE < channelsToSync.length) {
          console.log(`⏳ Waiting ${BATCH_DELAY}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

      console.log('🎉 Background sync completed successfully');

    } catch (error) {
      console.error('💥 Error in background sync:', error);
    }
  },

  // NEW: Manual full sync for a specific channel (fetch ALL videos)
  fullSyncChannel: async (channelId: string): Promise<{ success: boolean; videoCount: number; error?: string }> => {
    console.log(`\n🚀 === FULL CHANNEL SYNC STARTED ===`);
    console.log(`📺 Channel: ${channelId}`);
    console.log(`⚠️ This will fetch ALL videos from the channel and may take several minutes...`);
    
    try {
      // Fetch ALL videos from the channel
      const allVideos = await secureYoutubeService.getAllVideosByChannelId(
        channelId,
        (current, total) => {
          if (total) {
            const percentage = Math.round((current / total) * 100);
            console.log(`📊 Progress: ${current}/${total} videos (${percentage}%)`);
          } else {
            console.log(`📊 Progress: ${current} videos fetched...`);
          }
        }
      );
      
      // Store all videos in database
      if (allVideos.length > 0) {
        console.log(`💾 Storing ${allVideos.length} videos in database...`);
        await videosStorageApi.storeVideos(allVideos);
        
        // Update sync status
        const latestVideo = allVideos.sort((a, b) => 
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        )[0];
        
        await videosStorageApi.updateChannelSyncStatus(
          channelId,
          allVideos.length,
          latestVideo?.publishedAt || null
        );
        
        console.log(`🎉 FULL SYNC COMPLETE: ${allVideos.length} videos stored for channel ${channelId}`);
        
        return {
          success: true,
          videoCount: allVideos.length
        };
      } else {
        return {
          success: false,
          videoCount: 0,
          error: 'No videos found for this channel'
        };
      }
      
    } catch (error) {
      console.error('💥 Error in full channel sync:', error);
      return {
        success: false,
        videoCount: 0,
        error: String(error)
      };
    }
  }
}; 