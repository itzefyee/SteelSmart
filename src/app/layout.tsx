import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { Providers } from './providers';
import ChunkRetryHandler from '@/components/ChunkRetryHandler';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://github.com/itzefyee/SteelSmart';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'SteelSmart - AI-Powered Metal & Steel Parts Marketplace',
  description: 'Discover and source robotic components, structural steel, and custom fabricated parts with AI-powered CAD drawing analysis.',
  keywords: 'steel parts, robotic components, structural steel, CAD analysis, manufacturing, engineering',
  authors: [{ name: 'SteelSmart Team' }],
  creator: 'SteelSmart',
  publisher: 'SteelSmart',
  applicationName: 'SteelSmart Marketplace',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', sizes: 'any' }
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg'
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'SteelSmart - AI-Powered Metal & Steel Parts Marketplace',
    description: 'Discover and source robotic components, structural steel, and custom fabricated parts with AI-powered CAD drawing analysis.',
    url: siteUrl,
    siteName: 'SteelSmart',
    images: [
      {
        url: '/images/hero-bg.jpg',
        width: 1200,
        height: 630,
        alt: 'SteelSmart — AI-Powered Metal & Steel Parts Marketplace'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SteelSmart - AI-Powered Metal & Steel Parts Marketplace',
    description: 'Discover and source robotic components, structural steel, and custom fabricated parts with AI-powered CAD drawing analysis.',
    images: ['/images/hero-bg.jpg']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background`}>
        <ChunkRetryHandler />
        <Providers>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}