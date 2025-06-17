import { NextRequest, NextResponse } from 'next/server';
import { smartVideoSync } from '@/services/api/smartVideoSync';

const CRON_SECRET = process.env.CRON_SECRET;

// POST /api/videos/sync - Manual sync for specific channels
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelIds, videosPerChannel, fullSync = false } = body;

    if (!channelIds || !Array.isArray(channelIds) || channelIds.length === 0) {
      return NextResponse.json(
        { error: 'channelIds array is required' },
        { status: 400 }
      );
    }

    console.log('\n🔄 === MANUAL SYNC REQUEST ===');
    console.log(`📋 Channels: ${channelIds.length}`);
    console.log(`🎯 Videos per channel: ${videosPerChannel ? videosPerChannel : 'ALL videos (no limit)'}`);
    console.log(`🚀 Full sync mode: ${fullSync}`);

    // If no videosPerChannel is specified, treat as full sync
    const shouldFullSync = fullSync || videosPerChannel === undefined;

    if (shouldFullSync && channelIds.length > 1) {
      return NextResponse.json(
        { error: 'Full sync is only supported for one channel at a time due to processing intensity' },
        { status: 400 }
      );
    }

    if (shouldFullSync) {
      // Handle full sync for a single channel
      const channelId = channelIds[0];
      console.log(`🚀 Starting full sync for channel: ${channelId}`);
      
      const result = await smartVideoSync.fullSyncChannel(channelId);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Full sync completed for channel ${channelId}`,
          videoCount: result.videoCount,
          fullSync: true
        });
      } else {
        return NextResponse.json(
          { 
            error: result.error || 'Full sync failed',
            channelId,
            fullSync: true
          },
          { status: 500 }
        );
      }
    } else {
      // Handle regular smart sync for multiple channels
      const result = await smartVideoSync.syncChannelsVideos(
        channelIds,
        videosPerChannel, // Can be undefined for no limit
        false // Don't force refresh for manual requests
      );

      return NextResponse.json({
        success: true,
        totalVideos: result.videos.length,
        fromCache: result.fromCache,
        fromApi: result.fromApi,
        errors: result.errors,
        channels: channelIds.length
      });
    }

  } catch (error) {
    console.error('❌ Error in manual sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync videos', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/videos/sync - Background sync via cron job
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('\n⏰ === CRON JOB SYNC ===');
    console.log(`🕐 Started at: ${new Date().toISOString()}`);

    await smartVideoSync.backgroundSyncAllChannels();

    return NextResponse.json({
      success: true,
      message: 'Background sync completed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in background sync:', error);
    return NextResponse.json(
      { error: 'Failed to run background sync', details: String(error) },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 