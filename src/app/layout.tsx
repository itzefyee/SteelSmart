import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'SteelSmart - AI-Powered Metal & Steel Parts Marketplace',
  description: 'Discover and source robotic components, structural steel, and custom fabricated parts with AI-powered CAD drawing analysis.',
  keywords: 'steel parts, robotic components, structural steel, CAD analysis, manufacturing, engineering',
  authors: [{ name: 'SteelSmart Team' }],
  creator: 'SteelSmart',
  publisher: 'SteelSmart',
  applicationName: 'SteelSmart Marketplace',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: '/images/logo.svg',
    shortcut: '/favicon.svg'
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'SteelSmart - AI-Powered Metal & Steel Parts Marketplace',
    description: 'Discover and source robotic components, structural steel, and custom fabricated parts with AI-powered CAD drawing analysis.',
    url: 'https://steelsmart.com',
    siteName: 'SteelSmart',
    images: [
      {
        url: '/images/logo.svg',
        width: 120,
        height: 40,
        alt: 'SteelSmart Logo'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SteelSmart - AI-Powered Metal & Steel Parts Marketplace',
    description: 'Discover and source robotic components, structural steel, and custom fabricated parts with AI-powered CAD drawing analysis.',
    images: ['/images/logo.svg']
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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}