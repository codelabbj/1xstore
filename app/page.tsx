"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3FA9FF] via-[#0066FF] to-[#0044DD] flex flex-col items-center justify-center p-6">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <Image
          src="/1xstore-logo.png"
          alt="1xstore"
          width={180}
          height={60}
          className="h-auto w-auto max-w-[180px] drop-shadow-2xl mb-8"
          priority
        />
        
        {/* Loading Indicator */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
          </div>
          <p className="text-white/80 font-medium text-sm">Chargement...</p>
        </div>
      </div>
    </div>
  )
}
