"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center">
          <div className="text-[#4361ee] text-3xl font-bold flex items-center">
            <span className="mr-2">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0C8.95 0 0 8.95 0 20C0 31.05 8.95 40 20 40C31.05 40 40 31.05 40 20C40 8.95 31.05 0 20 0ZM16 29V11L30 20L16 29Z" fill="#4361ee"/>
              </svg>
            </span>
            ClikStats
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/faq" className="text-[#CCC] hover:text-white transition-colors">
            FAQ
          </Link>
          <Link href="/login" className="text-[#CCC] hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/signup" className="bg-[#4361ee] text-white px-4 py-2 rounded-full hover:bg-[#3a56d4] transition-colors">
            Sign Up
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <div className="w-full max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center">
          {/* Left Content - Text */}
          <div className="w-full md:w-1/2 mb-12 md:mb-0">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Your YouTube analytics
              <span className="block text-[#4361ee]">doesn't have to be</span>
              <span className="block">complicated.</span>
            </h1>
            
            <p className="text-[#9CA3AF] mb-8 max-w-md text-lg">
              ClikStats' advanced analytics dashboard helps creators identify trends, track performance metrics, and optimize content strategies to grow your channel faster than ever before.
            </p>
          </div>
          
          {/* Right Content - Image */}
          <div className="w-full md:w-1/2 flex flex-col items-center">
            <div className="relative w-full max-w-lg mb-8">
              <img 
                src="/images/dashboard-preview.svg" 
                alt="ClikStats Dashboard" 
                className="object-contain w-full h-auto rounded-lg shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/600x400?text=ClikStats+Dashboard";
                }}
              />
            </div>
            
            <div className="border-l-2 border-[#4361ee] pl-4 self-start">
              <p className="text-white font-bold text-lg">
                Built for creators. Powered by data. Backed by real results.
                <span className="block mt-1">Your shortcut to YouTube channel growth.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full bg-[#1a1a1a] py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">Powerful Features for Content Creators</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-[#242424] p-6 rounded-lg border-t-2 border-[#4361ee]">
                <div className="text-[#4361ee] mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Real-time Analytics</h3>
                <p className="text-gray-400">Track your channel's performance with hourly updates and live metrics.</p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-[#242424] p-6 rounded-lg border-t-2 border-[#4361ee]">
                <div className="text-[#4361ee] mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Competitor Analysis</h3>
                <p className="text-gray-400">Keep an eye on your competitors and learn from their most successful content.</p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-[#242424] p-6 rounded-lg border-t-2 border-[#4361ee]">
                <div className="text-[#4361ee] mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Performance Alerts</h3>
                <p className="text-gray-400">Get notified when your videos hit important milestones or trending status.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="w-full bg-[#121212] py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Ready to take your channel to the next level?</h2>
            <p className="text-gray-400 mb-8 text-lg">Join creators who are growing their YouTube channels with ClikStats.</p>
            <button 
              onClick={() => router.push('/signup')}
              className="bg-[#4361ee] text-white px-8 py-3 rounded-full font-medium hover:bg-[#3a56d4] transition-colors"
            >
              Get Started — It's Free
            </button>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="w-full bg-[#0a0a0a] py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} ClikStats. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 