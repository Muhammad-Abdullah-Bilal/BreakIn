// app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppProviders } from "@/providers/AppProviders"
import { Navigation } from "@/components/layout/Navigation"
import { ErrorBoundary } from "@/components/core/ErrorBoundary"
import { ToastContainer } from "@/components/ui/Toast"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BreakIn - Developer Skill Verification Platform",
  description: "Mentorship-first simulation platform for developer skill verification through real code, real teams, and real sprints.",
  keywords: ['developer', 'mentorship', 'skills', 'verification', 'coding', 'sprints'],
  authors: [{ name: 'BreakIn Team' }],
  openGraph: {
    title: 'BreakIn - Developer Skill Verification',
    description: 'Mentorship-first simulation platform for developer skill verification',
    type: 'website',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  robots: {
    index: true,
    follow: true,
  },
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={inter.className}>
        {/* Skip to content link for accessibility */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        
        <ErrorBoundary>
          <AppProviders>
            <div className="min-h-screen bg-background">
              <Navigation />
              
              <main 
                id="main-content" 
                className="relative"
                role="main"
                aria-label="Main content"
              >
                {children}
              </main>
              
              {/* Global Toast Container */}
              <ToastContainer />
            </div>
          </AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  )
}