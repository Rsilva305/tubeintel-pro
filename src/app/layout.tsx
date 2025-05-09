import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/contexts/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TubeIntel Pro',
  description: 'Advanced YouTube Analytics Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} dark:bg-gray-900 dark:text-white`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
} 