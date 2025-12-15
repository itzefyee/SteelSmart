import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { Providers } from './providers';

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
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', sizes: 'any' }
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg'
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Metalyze - AI-Powered Metal & Steel Parts Marketplace',
    description: 'Discover and source robotic components, structural steel, and custom fabricated parts with AI-powered CAD drawing analysis.',
    url: 'https://metalyze.com',
    siteName: 'Metalyze',
    images: [
      {
        url: '/images/logo.svg',
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