"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
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
    <div className="flex-1 flex flex-col items-center justify-center gap-6">
      <Image
        src="/Africash-logo.png"
        alt="Africash Logo"
        width={50}
        height={16}
        className="h-auto w-auto max-w-[150px]"
        priority
      />
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
