import type React from "react"
import Image from "next/image"
import { Footer } from "@/components/footer"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/10 to-background p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <Image
          src="/Africash-logo.png"
          alt="Africash Logo"
          width={50}
          height={16}
          className="h-auto w-auto max-w-[180px] sm:max-w-[200px] drop-shadow-sm"
          priority
        />
      </div>
      <div className="w-full max-w-md flex-1 flex items-center">{children}</div>
    </div>
  )
}
