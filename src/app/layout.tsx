// src/app/layout.tsx
// Root layout with AuthProvider and mobile optimization

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PantryPal - AI Recipe & Health Platform',
  description: 'Discover personalized recipes with AI-powered recommendations based on your health conditions and dietary preferences',
  keywords: 'recipes, AI, health, diet, cooking, meal planning, nutrition',
  authors: [{ name: 'PantryPal Team' }],
  creator: 'PantryPal',
  openGraph: {
    title: 'PantryPal - AI Recipe & Health Platform',
    description: 'Discover personalized recipes with AI-powered recommendations',
    url: 'https://pantrypal-health-platform.vercel.app',
    siteName: 'PantryPal',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

// Mobile viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Additional mobile optimizations */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${inter.className} h-full overflow-x-hidden antialiased`}>
        <AuthProvider>
          <div className="min-h-screen w-full max-w-full">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}