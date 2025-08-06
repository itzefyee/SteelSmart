import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

export const metadata: Metadata = {
  title: 'SteelSmart - AI-Powered Metal & Steel Parts Marketplace',
  description: 'Discover and source robotic components, structural steel, and custom fabricated parts with AI-powered CAD drawing analysis.',
  keywords: 'steel parts, robotic components, structural steel, CAD analysis, manufacturing, engineering',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background`}>
        {children}
      </body>
    </html>
  );
}