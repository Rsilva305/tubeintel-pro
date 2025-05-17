'use client';

import { useEffect, useState } from 'react';

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);

  // This useEffect will only run on the client after hydration
  useEffect(() => {
    setIsClient(true);
    console.log('Subscription layout hydrated');
  }, []);

  // Display a simple loading state until the client component is hydrated
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Once hydrated, render the children
  return <>{children}</>;
} 