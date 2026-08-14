// app/layout.tsx
import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { AppProviders } from "@/providers/AppProviders"
import { Navigation } from "@/components/layout/Navigation"
import { Toaster } from "@/components/ui/toaster"

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="bg-background text-foreground antialiased selection:bg-blue-500 selection:text-white">
        {/* Skip to content link for accessibility */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        
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
            <Toaster />
          </div>
        </AppProviders>
      </body>
    </html>
  )
}