"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Bell } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#0a0f1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#3FA9FF]/20 border-t-[#3FA9FF] animate-spin" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userInitials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1a]">
      {/* Top Header - Simple */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/1xstore-logo.png"
                alt="1xstore"
                width={110}
                height={35}
                className="h-8 w-auto"
                priority
              />
            </Link>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Link
                href="/notifications"
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Bell className="w-5 h-5" />
              </Link>

              {/* Theme */}
              <ThemeToggle />

              {/* Profile */}
              <Link
                href="/dashboard/profile"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3FA9FF] to-[#0066FF] flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-blue-500/20"
              >
                {userInitials}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>


      {/* Footer - Desktop only */}
      {/* <footer className="hidden sm:block mt-12 py-6 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-slate-400 dark:text-slate-500">
            © 2024 1xstore • Développé par{" "}
            <a href="https://wa.me/22947030588" target="_blank" rel="noopener noreferrer" className="text-[#3FA9FF] hover:underline">
              Code Lab
            </a>
          </p>
        </div>
      </footer> */}
    </div>
  )
}
