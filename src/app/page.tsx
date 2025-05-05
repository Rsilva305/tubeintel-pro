'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaYoutube, FaChartLine, FaSearch, FaUserFriends, FaBell } from 'react-icons/fa';

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: <FaChartLine className="text-indigo-500 text-3xl mb-4" />,
      title: "Advanced Analytics",
      description: "Get detailed insights on your video performance with real-time metrics and trends."
    },
    {
      icon: <FaSearch className="text-indigo-500 text-3xl mb-4" />,
      title: "Content Optimization",
      description: "Discover what works best for your channel with our data-driven recommendations."
    },
    {
      icon: <FaUserFriends className="text-indigo-500 text-3xl mb-4" />,
      title: "Competitor Analysis",
      description: "Track and analyze your competitors' strategies and performance metrics."
    },
    {
      icon: <FaBell className="text-indigo-500 text-3xl mb-4" />,
      title: "Performance Alerts",
      description: "Receive notifications when your videos reach important engagement thresholds."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
        <div className="container mx-auto px-6 py-16">
          <nav className="flex justify-between items-center mb-16">
            <div className="flex items-center">
              <FaYoutube className="text-red-500 text-3xl mr-2" />
              <span className="text-2xl font-bold">TubeIntel Pro</span>
            </div>
            <div>
              <Link href="/login" className="bg-white text-indigo-600 hover:bg-indigo-50 py-2 px-6 rounded-md font-medium mr-2">
                Sign In
              </Link>
              <Link href="/signup" className="bg-indigo-700 hover:bg-indigo-800 text-white py-2 px-6 rounded-md font-medium">
                Sign Up
              </Link>
            </div>
          </nav>
          
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Unlock Your YouTube Channel's Full Potential
              </h1>
              <p className="text-xl mb-8">
                TubeIntel Pro provides advanced analytics and insights to help you grow your YouTube channel, optimize your content, and outperform your competitors.
              </p>
              <button 
                onClick={() => router.push('/signup')}
                className="bg-white text-indigo-600 hover:bg-indigo-50 py-3 px-8 rounded-md font-medium text-lg"
              >
                Get Started Free
              </button>
            </div>
            <div className="md:w-1/2 mt-12 md:mt-0">
              <div className="bg-white p-2 rounded-lg shadow-xl">
                <img 
                  src="/dashboard-preview.png" 
                  alt="TubeIntel Pro Dashboard" 
                  className="rounded-md"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/600x400?text=TubeIntel+Pro+Dashboard";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features for Content Creators</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-md text-center">
                {feature.icon}
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-indigo-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to grow your YouTube channel?</h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto">
            Join thousands of content creators who are using TubeIntel Pro to optimize their content strategy and grow their audience.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={() => router.push('/signup')}
              className="bg-white text-indigo-600 hover:bg-indigo-50 py-3 px-8 rounded-md font-medium text-lg"
            >
              Sign Up Now
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-indigo-600 py-3 px-8 rounded-md font-medium text-lg"
            >
              Log In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center">
                <FaYoutube className="text-red-500 text-2xl mr-2" />
                <span className="text-xl font-bold">TubeIntel Pro</span>
              </div>
              <p className="mt-4 text-gray-400 max-w-md">
                Advanced YouTube analytics to help content creators grow their channels and optimize their content strategy.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/login" className="text-gray-400 hover:text-white">Login</Link></li>
                <li><Link href="/signup" className="text-gray-400 hover:text-white">Sign Up</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} TubeIntel Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 