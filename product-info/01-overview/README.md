# TubeIntel Pro
YouTube Analytics Dashboard for Content Creators

## Project Overview
TubeIntel Pro is a YouTube analytics and management platform designed to help content creators track, analyze, and optimize their channel performance. The platform provides real-time analytics, performance metrics, and insights to help creators make data-driven decisions.

## Features
- 📊 Dashboard with overview of channel performance
- 📈 Real-time VPH (Views Per Hour) tracking
- 🔍 Competitor tracking and analysis
- 📱 Responsive design for desktop and mobile
- 🔄 Real YouTube API integration or mock data mode
- 📊 Performance scoring and outlier detection
- 📈 Historical trend analysis
- 🔐 Secure authentication and user management

## Tech Stack
- **Frontend**: Next.js 13+ (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **API**: YouTube Data API v3
- **Charts**: Chart.js
- **Icons**: React Icons, Lucide Icons

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
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Setting Up Supabase
1. Create a Supabase project
2. Run the SQL from `src/lib/supabase-setup.sql` in the SQL Editor
3. Configure email authentication in Authentication > Providers
4. Update your `.env.local` file with your Supabase credentials

### YouTube API Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the YouTube Data API v3
4. Create an API key and add it to `.env.local`

## Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   └── api/              # API routes
├── components/            # Reusable components
├── contexts/             # React contexts
├── services/             # API and business logic
├── types/                # TypeScript types
└── utils/                # Utility functions
```

## User Flows

### New User Flow
1. User signs up
2. Receives verification email
3. Confirms email
4. Redirected to login
5. Completes onboarding
6. Access to dashboard

### Regular User Flow
1. User logs in
2. Redirected to dashboard
3. Views analytics
4. Can switch between views
5. Can sort/filter videos

## Development Status

### Completed Features
- Basic authentication
- Dashboard layout
- Video analytics
- Performance metrics
- Basic UI components

### In Progress
- UI/UX improvements
- Error handling
- Loading states
- Mobile responsiveness

### Planned Features
- Advanced analytics
- Export functionality
- Custom date ranges
- More detailed metrics

## Development Priorities

### Priority 1: MVP Launch
1. Error handling
2. User feedback
3. Basic security
4. Core functionality testing

### Priority 2: User Experience
1. Loading states
2. Error messages
3. Mobile responsiveness

### Priority 3: Additional Features
1. Basic analytics
2. Documentation
3. Performance optimization

## Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code style
- Document new features
- Test thoroughly
- Consider mobile-first design

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Support
For support, please:
1. Check the documentation
2. Open an issue on GitHub
3. Contact the development team

This documentation should be updated regularly as the project evolves. 