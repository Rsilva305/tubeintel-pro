import { User, Channel, Video, Alert, Competitor, Transcript, VideoMetadata, Insight } from '@/types';

// Create mock data for development
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'demo_user',
    email: 'demo@example.com',
    createdAt: new Date('2023-01-15'),
  },
];

export const mockChannels: Channel[] = [
  {
    id: '1',
    youtubeId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    name: 'My Channel',
    description: 'A channel about technology and programming',
    thumbnailUrl: 'https://via.placeholder.com/150',
    subscriberCount: 10000,
    videoCount: 120,
    viewCount: 1500000,
  },
];

export const mockVideos: Video[] = [
  {
    id: '1',
    youtubeId: 'dQw4w9WgXcQ',
    channelId: '1',
    title: 'How to Build a Next.js App',
    description: 'Learn how to build a modern web application with Next.js',
    thumbnailUrl: 'https://via.placeholder.com/320x180',
    publishedAt: new Date('2023-05-20'),
    viewCount: 25000,
    likeCount: 1500,
    commentCount: 300,
    vph: 150,
  },
  {
    id: '2',
    youtubeId: 'oHg5SJYRHA0',
    channelId: '1',
    title: 'React Hooks Deep Dive',
    description: 'Master React hooks with this comprehensive tutorial',
    thumbnailUrl: 'https://via.placeholder.com/320x180',
    publishedAt: new Date('2023-06-15'),
    viewCount: 18000,
    likeCount: 1200,
    commentCount: 250,
    vph: 120,
  },
  {
    id: '3',
    youtubeId: 'y8Yv4pnO7qc',
    channelId: '1',
    title: 'TypeScript for Beginners',
    description: 'Learn the basics of TypeScript and improve your code quality',
    thumbnailUrl: 'https://via.placeholder.com/320x180',
    publishedAt: new Date('2023-07-10'),
    viewCount: 15000,
    likeCount: 900,
    commentCount: 200,
    vph: 100,
  },
];

export const mockAlerts: Alert[] = [
  {
    id: '1',
    videoId: '1',
    type: 'vph',
    threshold: 100,
    message: 'Your video "How to Build a Next.js App" is trending with 150 views per hour!',
    createdAt: new Date('2023-05-21'),
    read: false,
  },
  {
    id: '2',
    videoId: '2',
    type: 'comment',
    threshold: 200,
    message: 'Your video "React Hooks Deep Dive" has reached 250 comments!',
    createdAt: new Date('2023-06-16'),
    read: true,
  },
];

export const mockCompetitors: Competitor[] = [
  {
    id: '1',
    youtubeId: 'UCAoR7VT1OI',
    name: 'Competitor A',
    thumbnailUrl: 'https://via.placeholder.com/150',
    subscriberCount: 50000,
    videoCount: 200,
    viewCount: 5000000,
  },
  {
    id: '2',
    youtubeId: 'UCXq2R7M',
    name: 'Competitor B',
    thumbnailUrl: 'https://via.placeholder.com/150',
    subscriberCount: 30000,
    videoCount: 150,
    viewCount: 3000000,
  },
];

export const mockTranscripts: Transcript[] = [
  {
    id: '1',
    videoId: '1',
    content: 'Hello everyone, welcome to this tutorial on building a Next.js application. Today, we\'ll explore how to set up a project, create components, and implement routing. Next.js is a React framework that provides features like server-side rendering and generating static websites.',
    createdAt: new Date('2023-05-20'),
  },
];

export const mockMetadata: VideoMetadata[] = [
  {
    id: '1',
    videoId: '1',
    tags: ['next.js', 'react', 'tutorial', 'web development'],
    category: 'Education',
    language: 'en',
    madeForKids: false,
    privacyStatus: 'public',
    dimension: '2d',
    definition: 'hd',
    caption: true,
    licensedContent: false,
    contentRating: {},
  },
];

export const mockInsights: Insight[] = [
  {
    id: '1',
    videoId: '1',
    channelId: '1',
    type: 'viral',
    summary: 'Your video is performing well in the "Web Development" category. To increase virality, consider adding more interactive elements and clearer call-to-actions.',
    details: {
      strengths: [
        'Clear explanations',
        'Good pace',
        'High-quality content'
      ],
      improvements: [
        'Add more visual examples',
        'Include downloadable resources',
        'Promote on social media'
      ],
      trends: [
        'Short-form content is gaining traction',
        'Tutorial videos with step-by-step guides are popular'
      ]
    },
    createdAt: new Date('2023-05-25'),
  },
]; 