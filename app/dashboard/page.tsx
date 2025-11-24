"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ArrowDownToLine, ArrowUpFromLine, Wallet, Loader2, ArrowRight, RefreshCw, MessageSquare, Send, Download, Ticket, Headphones } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { transactionApi, advertisementApi } from "@/lib/api-client"
import type { Transaction, Advertisement } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { formatPhoneNumberForDisplay } from "@/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"

export default function DashboardPage() {
  const { user } = useAuth()
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [isLoadingAd, setIsLoadingAd] = useState(true)
  const [adImageErrors, setAdImageErrors] = useState<Set<string>>(new Set())
  const [isChatPopoverOpen, setIsChatPopoverOpen] = useState(false)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [isCarouselPaused, setIsCarouselPaused] = useState(false)

  // Prevent browser back button from going to login
  useEffect(() => {
    // Replace current history entry to prevent going back
    window.history.replaceState(null, "", window.location.href)
    
    const handlePopState = (event: PopStateEvent) => {
      // Push current state again to prevent navigation
      window.history.pushState(null, "", window.location.href)
    }

    window.addEventListener("popstate", handlePopState)
    
    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  const fetchRecentTransactions = async () => {
    try {
      setIsLoadingTransactions(true)
      const data = await transactionApi.getHistory({
        page: 1,
        page_size: 5, // Get only the 5 most recent transactions
      })
      setRecentTransactions(data.results)
    } catch (error) {
      console.error("Error fetching recent transactions:", error)
      toast.error("Erreur lors du chargement des transactions récentes")
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const fetchAdvertisement = async () => {
    try {
      setIsLoadingAd(true)
      const response = await advertisementApi.get()
      // The API returns a paginated response with results array
      if (response && response.results && Array.isArray(response.results)) {
        // Get all advertisements where enable is true and have an image
        const enabledAds = response.results.filter(
          (ad: Advertisement) => ad.enable === true && (ad.image || ad.image_url)
        )
        setAdvertisements(enabledAds)
      } else {
        // Empty or invalid response - show placeholder
        setAdvertisements([])
      }
    } catch (error) {
      console.error("Error fetching advertisement:", error)
      // On error, show placeholder
      setAdvertisements([])
    } finally {
      setIsLoadingAd(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchRecentTransactions()
      fetchAdvertisement()
    }
  }, [user])

  // Refetch data when the page gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchRecentTransactions()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  const getAdvertisementImageUrl = (ad: Advertisement) => {
    return ad.image_url || ad.image || null
  }

  const getAdvertisementLink = (ad: Advertisement) => {
    return ad.url || ad.link || null
  }

  const handleAdImageError = (adId: string) => {
    setAdImageErrors(prev => new Set(prev).add(adId))
  }

  // Auto-play carousel
  useEffect(() => {
    if (!carouselApi || advertisements.length <= 1 || isCarouselPaused) return

    const interval = setInterval(() => {
      carouselApi.scrollNext()
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [carouselApi, advertisements.length, isCarouselPaused])

  const getStatusBadge = (status: Transaction["status"]) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "En attente" },
      accept: { variant: "default", label: "Accepté" },
      init_payment: { variant: "secondary", label: "En attente" },
      error: { variant: "destructive", label: "Erreur" },
      reject: { variant: "destructive", label: "Rejeté" },
      timeout: { variant: "outline", label: "Expiré" },
    }
    
    const config = statusConfig[status] || { variant: "outline" as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeBadge = (type: Transaction["type_trans"]) => {
    return (
      <Badge variant={type === "deposit" ? "default" : "secondary"}>
        {type === "deposit" ? "Dépôt" : "Retrait"}
      </Badge>
    )
  }

  return (
    <>
      <div className="space-y-8">
      {/* Hero Section with Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Welcome Card - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-5 sm:p-8 lg:p-10 text-primary-foreground shadow-2xl">
            <div className="relative z-10">
              <p className="text-xs sm:text-sm lg:text-base opacity-90 mb-1.5 sm:mb-2">Bonjour,</p>
              <h1 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-4 leading-tight">
                {user?.first_name} {user?.last_name}
              </h1>
              <p className="text-xs sm:text-base lg:text-lg opacity-80 mb-4 sm:mb-6">Gérez vos transactions en toute simplicité</p>
              
              {/* Quick Actions in Hero */}
              <div className="flex gap-1.5 sm:gap-2 md:gap-3 mt-4 sm:mt-6">
                <Link href="/dashboard/deposit" className="flex-1 min-w-0">
                  <div className="group flex items-center justify-center gap-1 sm:gap-2 md:gap-3 px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 md:py-3 rounded-md sm:rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all cursor-pointer border border-white/20">
                    <div className="p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg bg-white/30 flex-shrink-0">
                      <ArrowDownToLine className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <span className="font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base truncate">Dépôt</span>
                  </div>
                </Link>
                <Link href="/dashboard/withdrawal" className="flex-1 min-w-0">
                  <div className="group flex items-center justify-center gap-1 sm:gap-2 md:gap-3 px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 md:py-3 rounded-md sm:rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all cursor-pointer border border-white/20">
                    <div className="p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg bg-white/30 flex-shrink-0">
                      <ArrowUpFromLine className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <span className="font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base truncate">Retrait</span>
                  </div>
                </Link>
                <Link href="/dashboard/coupon" className="flex-1 min-w-0">
                  <div className="group flex items-center justify-center gap-1 sm:gap-2 md:gap-3 px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 md:py-3 rounded-md sm:rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all cursor-pointer border border-white/20">
                    <div className="p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg bg-white/30 flex-shrink-0">
                      <Ticket className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <span className="font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base truncate">Coupon</span>
                  </div>
                </Link>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/5 rounded-full -mr-24 -mt-24 sm:-mr-32 sm:-mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-36 h-36 sm:w-48 sm:h-48 bg-white/5 rounded-full -ml-18 -mb-18 sm:-ml-24 sm:-mb-24 blur-3xl"></div>
          </div>
        </div>

        {/* Advertisement Section with Download Button - Takes 1 column */}
        <div className="lg:col-span-1 flex">
          <div className="relative w-full flex flex-col rounded-2xl sm:rounded-3xl border-2 border-muted-foreground/20 hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden bg-background">
          {isLoadingAd ? (
              <div className="relative w-full min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] bg-muted/20 flex items-center justify-center flex-1">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
              </div>
            ) : advertisements.length > 0 ? (
              <>
                <div className="relative w-full flex-shrink-0">
              <Carousel
                setApi={setCarouselApi}
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
                onTouchStart={() => setIsCarouselPaused(true)}
                onTouchEnd={() => setIsCarouselPaused(false)}
                onMouseEnter={() => setIsCarouselPaused(true)}
                onMouseLeave={() => setIsCarouselPaused(false)}
              >
                <CarouselContent className="-ml-0">
                  {advertisements.map((ad) => {
                    const imageUrl = getAdvertisementImageUrl(ad)
                    const link = getAdvertisementLink(ad)
                    const adId = ad.id?.toString() || ""
                    const hasError = adImageErrors.has(adId)
                    
                    if (!imageUrl || hasError) return null
                    
                    return (
                          <CarouselItem key={adId} className="pl-0 basis-full">
                            <div className="relative w-full">
                          <Image
                            src={imageUrl}
                            alt={ad.title || "Publicité"}
                                width={0}
                                height={0}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className={link ? "w-full h-auto cursor-pointer" : "w-full h-auto"}
                            onError={() => handleAdImageError(adId)}
                                priority={false}
                          />
                          {link && (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 z-10"
                              aria-label={ad.title || "Voir la publicité"}
                            />
                          )}
                        </div>
                      </CarouselItem>
                    )
                  })}
                </CarouselContent>
              </Carousel>
                </div>
                {/* Download Button integrated */}
                <div className="p-4 sm:p-5 border-t border-muted-foreground/20 bg-muted/5">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium flex items-center justify-center gap-2 border-2 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    {/* <a href="/app-v1.0.5.apk" download="Africash-v1.0.5.apk" className="flex items-center gap-2"> */}
                    <a href="" download="" className="flex items-center gap-2">
                      <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">Télécharger l'application mobile</span>
                      <span className="sm:hidden">Télécharger l'app</span>
                    </a>
                  </Button>
                </div>
              </>
            ) : (
              <div className="relative w-full flex flex-col flex-1">
                <div className="relative w-full min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center border-b border-muted-foreground/20 flex-1">
                  <div className="text-center p-4 sm:p-6">
                    <p className="text-sm sm:text-base lg:text-lg text-muted-foreground font-semibold">Espace publicitaire</p>
                    <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1.5">Publicité</p>
                  </div>
                </div>
                {/* Download Button integrated */}
                <div className="p-4 sm:p-5 border-t border-muted-foreground/20 bg-muted/5">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium flex items-center justify-center gap-2 border-2 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <a href="/app-v1.0.5.apk" download="Africash-v1.0.5.apk" className="flex items-center gap-2">
                      <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">Télécharger l'application mobile</span>
                      <span className="sm:hidden">Télécharger l'app</span>
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

      {/* Recent Activity - Clean Professional Design */}
      <div className="space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold">Activité récente</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Vos dernières transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={fetchRecentTransactions}
              disabled={isLoadingTransactions}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
              <Link href="/dashboard/history" className="flex items-center gap-1.5 sm:gap-2">
                <span className="hidden sm:inline">Voir tout</span>
                <span className="sm:hidden">Tout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        
        {isLoadingTransactions ? (
          <div className="flex items-center justify-center py-12 sm:py-16 rounded-lg border border-border">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 rounded-lg border border-border bg-muted/30">
            <Wallet className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm sm:text-base text-muted-foreground text-center font-medium">Aucune transaction récente</p>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-1">Vos transactions apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            {recentTransactions.map((transaction) => (
              <Card 
                key={transaction.id} 
                className="group border border-border hover:border-border/80 transition-colors duration-150 bg-card"
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                            transaction.type_trans === "deposit" 
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" 
                        : "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400"
                          }`}>
                            {transaction.type_trans === "deposit" ? (
                        <ArrowDownToLine className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                        <ArrowUpFromLine className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                          </div>
                    
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        {/* Left: Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm sm:text-base text-foreground">
                              #{transaction.reference}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {getTypeBadge(transaction.type_trans)}
                              {getStatusBadge(transaction.status)}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {transaction.app_details?.name || transaction.app}
                          </p>
                          <p className="text-[11px] sm:text-xs text-muted-foreground">
                            {transaction.user_app_id && (
                              <span className="font-mono">ID pari: {transaction.user_app_id}</span>
                            )}
                            {transaction.user_app_id && transaction.phone_number && <span className="mx-1.5">•</span>}
                            {transaction.phone_number && (
                              <span>{formatPhoneNumberForDisplay(transaction.phone_number)}</span>
                            )}
                            {(transaction.user_app_id || transaction.phone_number) && (
                              <span className="mx-1.5">•</span>
                            )}
                            <span>{format(new Date(transaction.created_at), "dd MMM yyyy, HH:mm", { locale: fr })}</span>
                          </p>
                        </div>
                        
                        {/* Right: Amount */}
                        <div className="flex-shrink-0 text-right">
                          <p className={`text-base sm:text-lg font-semibold ${
                            transaction.type_trans === "deposit" 
                              ? "text-emerald-600 dark:text-emerald-400" 
                              : "text-orange-600 dark:text-orange-400"
                          }`}>
                            {transaction.type_trans === "deposit" ? "+" : "−"}
                            {transaction.amount.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "XOF",
                              minimumFractionDigits: 0,
                            })}
                          </p>
                        </div>
                      </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              ))}
          </div>
        )}
      </div>
      </div>
      
      <Popover open={isChatPopoverOpen} onOpenChange={setIsChatPopoverOpen}>
        <PopoverTrigger asChild>
        <Button
          className="fixed right-4 bottom-24 sm:bottom-10 sm:right-8 h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary border border-primary/20"
          aria-label="Support client"
        >
          <Headphones className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="sr-only">Support client</span>
        </Button>
        </PopoverTrigger>
        <PopoverContent 
        className="w-56 p-2 mb-2 mr-2" 
        align="end"
        side="top"
      >
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={() => {
              // Replace with your WhatsApp number (format: country code + number without + or spaces)
              window.open("https://wa.me/message/234000000000 ", "_blank")
              setIsChatPopoverOpen(false)
            }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#25D366] text-white">
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">WhatsApp</span>
              <span className="text-xs text-muted-foreground">Chat sur WhatsApp</span>
            </div>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={() => {
              // Replace with your Telegram username
              window.open("https://t.me/Africash", "_blank")
              setIsChatPopoverOpen(false)
            }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white">
              <Send className="h-4 w-4" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">Telegram</span>
              <span className="text-xs text-muted-foreground">Chat sur Telegram</span>
            </div>
          </Button>
        </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
