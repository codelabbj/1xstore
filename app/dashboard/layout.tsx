"use client"

import React, { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Loader2, Bell, Gift } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { settingsApi } from "@/lib/api-client"
import { Footer } from "@/components/footer"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const [referralBonusEnabled, setReferralBonusEnabled] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsApi.get()
        setReferralBonusEnabled(settings?.referral_bonus === true)
      } catch (error) {
        console.error("Error fetching settings:", error)
        setReferralBonusEnabled(false)
      }
    }
    if (user) {
      fetchSettings()
    }
  }, [user])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userInitials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/90">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/dashboard" className="flex items-center transition-opacity hover:opacity-90 active:opacity-75">
                <Image
                  src="/Africash-logo.png"
                  alt="Africash Logo"
                  width={40}
                  height={13}
                  className="h-auto w-auto max-w-[90px] sm:max-w-[110px] md:max-w-[130px]"
                  priority
                />
              </Link>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Bonus Button */}
              {referralBonusEnabled && (
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <Link href="/dashboard/bonus" className="flex items-center justify-center">
                    <Gift className="h-4 w-4 sm:h-[18px] sm:w-[18px] md:h-5 md:w-5" />
                  </Link>
                </Button>
              )}
              
              {/* Notifications Button */}
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-lg hover:bg-muted/80 transition-colors relative"
              >
                <Link href="/notifications" className="flex items-center justify-center">
                  <Bell className="h-4 w-4 sm:h-[18px] sm:w-[18px] md:h-5 md:w-5" />
                </Link>
              </Button>
              
              {/* Theme Toggle */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-lg hover:bg-muted/80 transition-colors p-0"
                  >
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 ring-1 ring-border/50">
                      <AvatarFallback className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground text-[10px] sm:text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 sm:w-64 shadow-lg border-border/50" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal px-3 py-2.5">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-semibold leading-tight text-foreground">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs leading-tight text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem asChild className="cursor-pointer px-3 py-2">
                    <Link href="/dashboard/profile" className="flex items-center w-full">
                      <User className="mr-2 h-4 w-4" />
                      <span className="text-sm">Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem 
                    onClick={logout} 
                    className="text-destructive focus:text-destructive cursor-pointer px-3 py-2"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="text-sm">Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Mobile Theme Toggle */}
              <div className="sm:hidden">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">{children}</main>
    </div>
  )
}
