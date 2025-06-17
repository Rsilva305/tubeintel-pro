import { NextRequest, NextResponse } from 'next/server';
import { videosStorageApi } from '@/services/api/videos';

export const dynamic = 'force-dynamic';

// GET /api/videos/stored?channelIds=id1,id2,id3&limit=20
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const channelIdsParam = searchParams.get('channelIds');
    const limitParam = searchParams.get('limit');

    if (!channelIdsParam) {
      return NextResponse.json(
        { error: 'channelIds parameter is required' },
        { status: 400 }
      );
    }

    const channelIds = channelIdsParam.split(',').filter(id => id.trim());
    // If no limit is provided, fetch all videos (undefined means no limit)
    const limit = limitParam ? parseInt(limitParam) : undefined;

    if (channelIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid channel ID is required' },
        { status: 400 }
      );
    }

    console.log(`📦 Fetching stored videos for channels: ${channelIds.join(', ')}`);
    console.log(`📊 Limit: ${limit ? limit : 'No limit (all videos)'}`);

    const videos = await videosStorageApi.getStoredVideosForChannels(channelIds, limit);

    // Get sync status for each channel
    const syncStatuses = await Promise.all(
      channelIds.map(async (channelId) => ({
        channelId,
        status: await videosStorageApi.getChannelSyncStatus(channelId),
        videoCount: await videosStorageApi.getStoredVideoCount(channelId)
      }))
    );

    return NextResponse.json({
      success: true,
      data: {
        videos,
        totalVideos: videos.length,
        channelSyncStatuses: syncStatuses,
        requestedChannels: channelIds.length,
        limit: limit || 'unlimited'
      }
    });

  } catch (error) {
    console.error('Error fetching stored videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stored videos', details: String(error) },
      { status: 500 }
    );
  }
} 