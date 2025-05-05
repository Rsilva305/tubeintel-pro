# TubeIntel Pro
YouTube Analytics Dashboard for Content Creators

## Features
- Real-time analytics
- Competitor analysis
- Content optimization recommendations
- Performance tracking

## Branch Protection Testing
This line was added to test branch protection rules.

## Features

- 📊 Dashboard with overview of channel performance
- 📈 Real-time VPH (Views Per Hour) tracking
- 🔍 Competitor tracking and analysis
- 📱 Responsive design for desktop and mobile
- 🔄 Real YouTube API integration or mock data mode

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **API**: YouTube Data API v3
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Google account with YouTube Data API v3 enabled
- A Supabase account (optional, can use demo mode)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tubeintel-pro.git
   cd tubeintel-pro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Setting Up Supabase (Optional)

If you want to use real authentication:

1. Create a Supabase project
2. Run the SQL from `src/lib/supabase-setup.sql` in the SQL Editor
3. Configure email authentication in Authentication > Providers
4. Update your `.env.local` file with your Supabase credentials

## Demo Mode

You can use the app without a Supabase account or YouTube API key by toggling "Demo Mode" on the login page.

## YouTube API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the YouTube Data API v3
4. Create an API key and add it to `.env.local`

## License

This project is licensed under the MIT License - see the LICENSE file for details. 