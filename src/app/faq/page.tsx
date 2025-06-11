'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaChevronDown, FaChevronUp, FaCrown, FaRocket, FaDollarSign, FaYoutube, FaCog } from 'react-icons/fa';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'pricing' | 'features' | 'technical' | 'upgrade' | 'support';
  isPro?: boolean;
}

const faqData: FAQItem[] = [
  // Upgrade-focused questions (most important)
  {
    id: 'why-upgrade',
    question: 'Why should I upgrade from Free to Pro?',
    answer: 'The Pro tier transforms your YouTube analytics experience with powerful features that serious creators need:\n\n• **Unlimited Competitor Tracking** - Monitor as many channels as you want (Free: 5 channels max)\n• **Advanced Analytics Dashboard** - Deeper insights into your audience behavior and performance\n• **Priority Support** - Get faster response times through our Discord ticket system\n• **Advanced Performance Metrics** - Comprehensive analytics and reporting tools',
    category: 'upgrade',
    isPro: true
  },
  {
    id: 'free-vs-pro-limits',
    question: 'What are the limitations of the Free tier?',
    answer: `The Free tier is perfect for getting started, but has some limitations:

**Free Tier Limits:**
• Track up to 5 competitor channels
• Basic analytics dashboard
• Community support through Discord

**Pro Tier Benefits:**
• **Unlimited** competitor tracking
• Advanced analytics dashboard with deeper insights
• Priority support through Discord ticket system with faster response times

Most successful creators upgrade within their first month once they see the value of deeper analytics.`,
    category: 'upgrade',
    isPro: true
  },
  {
    id: 'roi-pro-subscription',
    question: 'How quickly will Pro pay for itself?',
    answer: `Pro typically pays for itself within 1-2 optimized videos:

**Real Examples:**
• **Advanced Analytics**: Better insights lead to 15-30% improvement in content performance
• **Competitor Analysis**: Learning from successful competitors helps avoid costly mistakes
• **Unlimited Tracking**: Monitor more channels to identify trending opportunities faster

**Quick Math:**
• Pro costs $29.99/month
• Average YouTube RPM: $1-5 per 1,000 views
• You only need 6,000-30,000 additional views per month to break even
• Most Pro users see this increase through better content optimization

Plus, the time saved on manual research and analysis is worth hundreds of dollars in opportunity cost.`,
    category: 'upgrade',
    isPro: true
  },
  {
    id: 'upgrade-benefits',
    question: 'What are the benefits of upgrading to Pro?',
    answer: 'Pro subscribers get unlimited competitor tracking, advanced analytics dashboard, and priority support through our Discord ticket system. This means faster response times and dedicated support channels for all your needs.',
    category: 'upgrade',
    isPro: true
  },

  // General Questions
  {
    id: 'what-is-clikstats',
    question: 'What is ClikStats?',
    answer: 'ClikStats is a comprehensive YouTube analytics platform designed specifically for content creators. We provide real-time analytics, competitor tracking, trend analysis, and optimization tools to help you grow your channel faster and more efficiently.',
    category: 'general'
  },
  {
    id: 'how-does-it-work',
    question: 'How does ClikStats work?',
    answer: 'Simply connect your YouTube channel during onboarding, and ClikStats automatically starts tracking your performance metrics. Our dashboard updates hourly with views, engagement rates, subscriber growth, and performance trends. You can also add competitor channels to track their strategies and identify opportunities.',
    category: 'general'
  },
  {
    id: 'data-safety',
    question: 'Is my YouTube data safe and secure?',
    answer: 'Absolutely. We use enterprise-grade security measures to protect your data. We only access publicly available YouTube data through official APIs and never store sensitive information. Your channel credentials are encrypted, and we comply with all major data protection regulations.',
    category: 'general'
  },

  // Features
  {
    id: 'competitor-tracking',
    question: 'How does competitor tracking work?',
    answer: 'Add any YouTube channel to your competitor lists and track their performance metrics, upload schedules, trending videos, and growth patterns. This helps you identify successful content strategies and stay ahead of trends in your niche. Pro users can track unlimited competitors with advanced filtering and analysis.',
    category: 'features'
  },

  // Pricing
  {
    id: 'pricing-plans',
    question: 'What are your pricing plans?',
    answer: `We offer flexible pricing to match your needs:

**Free Tier** - Perfect for beginners
• Basic analytics dashboard
• Track up to 5 competitors
• 1 competitor folder
• Email support

**Pro Tier - $29.99/month** - For serious creators
• Everything in Free
• Unlimited competitor tracking
• Advanced analytics dashboard
• Priority support
• Advanced exports`,
    category: 'pricing'
  },
  {
    id: 'free-trial',
    question: 'Do you offer a free trial for Pro?',
    answer: 'Yes! You can start with our Free tier to explore the platform, then upgrade to Pro anytime. We also offer a 7-day money-back guarantee on Pro subscriptions if you\'re not completely satisfied with the additional features.',
    category: 'pricing'
  },
  {
    id: 'cancel-anytime',
    question: 'Can I cancel my subscription anytime?',
    answer: 'Absolutely! You can cancel your Pro subscription at any time from your account settings. You\'ll continue to have Pro access until the end of your current billing period, then automatically switch back to the Free tier.',
    category: 'pricing'
  },

  // Technical
  {
    id: 'channel-connection',
    question: 'How do I connect my YouTube channel?',
    answer: 'During onboarding, you can either search for your channel by name or enter your channel ID directly. We use YouTube\'s official API to securely connect and fetch your analytics data. The process takes less than 2 minutes.',
    category: 'technical'
  },
  {
    id: 'data-updates',
    question: 'How often is my data updated?',
    answer: 'Your analytics data is updated every hour to provide near real-time insights. This includes view counts, subscriber changes, engagement metrics, and performance trends. Pro users get priority processing for faster updates during peak times.',
    category: 'technical'
  },
  {
    id: 'multiple-channels',
    question: 'Can I track multiple YouTube channels I own?',
    answer: 'Currently, each ClikStats account is designed for one primary YouTube channel. However, you can track other channels you own as competitors to compare performance. We\'re working on multi-channel support for Pro+ users.',
    category: 'technical'
  },
  {
    id: 'browser-support',
    question: 'Which browsers are supported?',
    answer: 'ClikStats works on all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using the latest version of Chrome or Firefox. Our platform is also mobile-responsive for on-the-go analytics.',
    category: 'technical'
  },

  // Support
  {
    id: 'free-limits',
    question: 'What are the limits of the Free tier?',
    answer: 'The Free tier includes basic analytics dashboard, tracking up to 5 competitors, and basic insights. Support is provided through our Discord community.',
    category: 'pricing'
  },
  {
    id: 'pro-benefits',
    question: 'What do I get with the Pro subscription?',
    answer: 'Pro subscribers get unlimited competitor tracking, advanced analytics dashboard, and priority support through our Discord ticket system. Pro users get faster response times and dedicated support channels.',
    category: 'pricing',
    isPro: true
  },
  {
    id: 'support-difference',
    question: 'What\'s the difference between Free and Pro support?',
    answer: 'Free users can access our Discord community for support. Pro users get priority access to our Discord ticket system with faster response times and dedicated support channels.',
    category: 'support'
  },
  {
    id: 'how-support',
    question: 'How do I get support?',
    answer: 'All support is handled through our Discord server. Free users can post in the community channels, while Pro users can create priority support tickets for faster assistance.',
    category: 'support'
  },
  {
    id: 'free-limitations',
    question: 'What are the limitations of the Free tier?',
    answer: 'The Free tier is limited to tracking up to 5 competitors and includes basic analytics features. Support is provided through our Discord community channels.',
    category: 'upgrade'
  },
  {
    id: 'pro-features',
    question: 'What features are included in the Pro tier?',
    answer: 'Pro tier includes unlimited competitor tracking, advanced analytics dashboard, and priority support through our Discord ticket system with faster response times.',
    category: 'upgrade',
    isPro: true
  }
];

const categories = [
  { id: 'upgrade', name: 'Upgrading to Pro', icon: FaCrown, color: 'text-yellow-500' },
  { id: 'general', name: 'General', icon: FaYoutube, color: 'text-red-500' },
  { id: 'features', name: 'Features', icon: FaRocket, color: 'text-blue-500' },
  { id: 'pricing', name: 'Pricing', icon: FaDollarSign, color: 'text-green-500' },
  { id: 'technical', name: 'Technical', icon: FaCog, color: 'text-purple-500' },
  { id: 'support', name: 'Support', icon: FaCog, color: 'text-purple-500' }
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>(['why-upgrade']); // Open the most important question by default
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className="text-[#4361ee] text-3xl font-bold flex items-center">
            <span className="mr-2">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0C8.95 0 0 8.95 0 20C0 31.05 8.95 40 20 40C31.05 40 40 31.05 40 20C40 8.95 31.05 0 20 0ZM16 29V11L30 20L16 29Z" fill="#4361ee"/>
              </svg>
            </span>
            ClikStats
          </div>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-[#CCC] hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/signup" className="bg-[#4361ee] text-white px-4 py-2 rounded-full hover:bg-[#3a56d4] transition-colors">
            Sign Up
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Everything you need to know about ClikStats, our features, and how to grow your YouTube channel faster.
          </p>
        </div>

        {/* Upgrade CTA Banner */}
        <div className="bg-gradient-to-r from-[#4361ee] to-[#7209b7] rounded-xl p-6 mb-8 text-center">
          <div className="flex items-center justify-center mb-3">
            <FaCrown className="text-yellow-400 mr-2" size={24} />
            <h2 className="text-2xl font-bold">Ready to Supercharge Your Channel?</h2>
          </div>
          <p className="text-lg mb-4 opacity-90">
            Join thousands of creators who've upgraded to Pro and seen 3x faster growth
          </p>
          <Link 
            href="/subscription" 
            className="inline-block bg-white text-[#4361ee] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
          >
            Upgrade to Pro - $29.99/month
          </Link>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#4361ee] text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All Questions
          </button>
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-[#4361ee] text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon className={category.color} size={16} />
                {category.name}
              </button>
            );
          })}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map(item => (
            <div 
              key={item.id} 
              className={`bg-[#1a1a1a] rounded-xl border transition-all duration-200 ${
                item.isPro 
                  ? 'border-yellow-500/30 bg-gradient-to-r from-[#1a1a1a] to-[#2a1a00]' 
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full p-6 text-left flex justify-between items-center hover:bg-white/5 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  {item.isPro && <FaCrown className="text-yellow-500 flex-shrink-0" size={18} />}
                  <h3 className="text-lg font-semibold text-white pr-4">
                    {item.question}
                  </h3>
                </div>
                {openItems.includes(item.id) ? (
                  <FaChevronUp className="text-gray-400 flex-shrink-0" />
                ) : (
                  <FaChevronDown className="text-gray-400 flex-shrink-0" />
                )}
              </button>
              
              {openItems.includes(item.id) && (
                <div className="px-6 pb-6">
                  <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {item.answer}
                  </div>
                  {item.isPro && (
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FaCrown className="text-yellow-500" size={16} />
                        <span className="font-semibold text-yellow-400">Pro Feature</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        This feature is available with ClikStats Pro. 
                        <Link href="/subscription" className="text-yellow-400 hover:text-yellow-300 ml-1 underline">
                          Upgrade now to unlock this and many more advanced features.
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center bg-[#1a1a1a] rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-gray-400 mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup" 
              className="bg-[#4361ee] text-white px-8 py-3 rounded-full font-medium hover:bg-[#3a56d4] transition-colors"
            >
              Get Started Free
            </Link>
            <a 
              href="https://discord.gg/asghh6CJra" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-gray-800 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-700 transition-colors"
            >
              Join Our Discord
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0a0a0a] py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} ClikStats. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}