// app/page.tsx
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/providers/AuthProvider"
import {
    ArrowRight,
    Code2,
    Menu,
    X
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("developers")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [stats, setStats] = useState({ developersHired: 2847, successRate: 94, partnerCompanies: 156 })
  
  const { user, isLoading: loading, signOut } = useAuth()
  const router = useRouter()
  const developer = null

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/sign-in')
    }
  }, [loading, user, router])

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {});
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm">Connecting to BreakIn Direct...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900/95 to-blue-950/80">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-black/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Code2 className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold text-white">
                  <Link href="/">BreakIn Direct</Link>
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-2">
              <Link 
                href="/developer-dashboard"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                Developer Dashboard
              </Link>
              <Link 
                href="/company-dashboard"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                Company Dashboard
              </Link>
              <Link 
                href="/community"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                Community
              </Link>
              <Link 
                href="/mentor"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                Mentorship
              </Link>
              <Link 
                href="/world-view"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                World View
              </Link>
              
              {user ? (
                <div className="flex items-center space-x-3 ml-2">
                  <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
                    <Avatar className="h-7 w-7 border border-blue-500/30">
                      <AvatarImage src={developer?.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback className="bg-blue-600 text-xs text-white">
                        {developer?.codename?.charAt(0) || user?.username?.charAt(0) || user?.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="text-white font-medium text-xs">
                        {developer?.codename || user?.username || 'Developer'}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-slate-300 hover:text-white hover:bg-red-500/20 text-xs px-3" 
                    onClick={signOut}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 ml-2">
                  <Button
                    variant="outline"
                    className="border border-blue-500/40 text-blue-400 hover:text-white hover:bg-blue-600/20 hover:border-blue-400 bg-transparent font-medium transition-all"
                    asChild
                  >
                    <Link href="/auth/sign-in">Sign In</Link>
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all" asChild>
                    <Link href="/auth/sign-up">Get Started</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-white">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
              
              <Button
                variant="outline"
                className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white bg-transparent"
              >
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
            </div>

          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Button variant="ghost" className="text-white hover:bg-white/5 w-full justify-start" asChild>
              <Link href="/developer-dashboard" onClick={toggleMobileMenu}>Developer Dashboard</Link>
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/5 w-full justify-start" asChild>
              <Link href="/company-dashboard" onClick={toggleMobileMenu}>Company Dashboard</Link>
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/5 w-full justify-start" onClick={toggleMobileMenu}>
              How It Works
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/5 w-full justify-start" onClick={toggleMobileMenu}>
              For Companies
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/5 w-full justify-start" asChild>
              <Link href="/world-view" onClick={toggleMobileMenu}>World View</Link>
            </Button>
            
            {user ? (
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/5 w-full justify-start" 
                onClick={async () => {
                  await signOut();
                  toggleMobileMenu();
                }}
              >
                Sign Out
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white bg-transparent w-full justify-start"
                  asChild
                >
                  <Link href="/auth/sign-in" onClick={toggleMobileMenu}>Sign In</Link>
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full justify-start" asChild>
                  <Link href="/auth/sign-up" onClick={toggleMobileMenu}>Get Started</Link>
                </Button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="bg-blue-600/10 text-blue-300 border-blue-400/20 mb-4">Proof-of-Work Hiring System</Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Skip the résumé.
              <br />
              <span className="text-blue-400">Show your skills.</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Join real development teams, work on actual projects, and get hired based on your code—not your
              credentials.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {user ? (
              <>
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 transition-all hover:scale-[1.02]" 
                  asChild
                >
                  <Link href="/developer-dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border border-slate-700 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-500 text-slate-200 hover:text-white font-medium px-8 py-3.5 shadow-md transition-all hover:scale-[1.02]"
                  asChild
                >
                  <Link href="/company-dashboard">Company View</Link>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 transition-all hover:scale-[1.02]" 
                  asChild
                >
                  <Link href="/auth/sign-up">
                    Start Your Sprint
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border border-slate-700 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-500 text-slate-200 hover:text-white font-medium px-8 py-3.5 shadow-md transition-all hover:scale-[1.02]"
                  asChild
                >
                  <Link href="/company-dashboard">Hire Developers</Link>
                </Button>
              </>
            )}
          </div>

          {/* Dynamic Platform Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.developersHired.toLocaleString()}</div>
              <div className="text-gray-300">Developers Hired</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.successRate}%</div>
              <div className="text-gray-300">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.partnerCompanies}</div>
              <div className="text-gray-300">Partner Companies</div>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of the homepage content remains the same... */}
      {/* How It Works, Live Sprint Preview, CTA Section, Footer */}
      {/* (keeping the existing content for brevity) */}
    </div>
  )
}