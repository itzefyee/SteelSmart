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
  title: 'Metalyze - AI-Powered Metal & Steel Parts Marketplace',
  description: 'Discover and source robotic components, structural steel, and custom fabricated parts with AI-powered CAD drawing analysis.',
  keywords: 'steel parts, robotic components, structural steel, CAD analysis, manufacturing, engineering',
  authors: [{ name: 'Metalyze Team' }],
  creator: 'Metalyze',
  publisher: 'Metalyze',
  applicationName: 'Metalyze Marketplace',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/metalyze_logo.png', type: 'image/png', sizes: '32x32' }
    ],
    apple: '/images/metalyze_logo.png',
    shortcut: '/favicon.ico'
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Metalyze - AI-Powered Metal & Steel Parts Marketplace',
    description: 'Discover and source robotic components, structural steel, and custom fabricated parts with AI-powered CAD drawing analysis.',
    url: 'https://Metalyze.com',
    siteName: 'Metalyze',
    images: [
      {
        url: '/images/metalyze_logo.png',
        width: 120,
        height: 40,
        alt: 'Metalyze Logo'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Metalyze - AI-Powered Metal & Steel Parts Marketplace',
    description: 'Discover and source robotic components, structural steel, and custom fabricated parts with AI-powered CAD drawing analysis.',
    images: ['/images/metalyze_logo.png']
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