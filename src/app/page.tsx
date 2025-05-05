'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Simply redirect to login page
    router.push('/login');
  }, [router]);

  // This page won't be displayed, but we'll include a loading indicator just in case
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-gray-600">Loading TubeIntel Pro...</p>
    </div>
  );
} 