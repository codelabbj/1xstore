"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Ticket, Copy, Check, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { couponApi, platformApi } from "@/lib/api-client"
import type { Coupon, Platform } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function CouponPage() {
  const { user } = useAuth()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    fetchCoupons()
    fetchPlatforms()
  }, [])

  useEffect(() => {
    const handleFocus = () => fetchCoupons()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const fetchPlatforms = async () => {
    try {
      const data = await platformApi.getAll()
      setPlatforms(data)
    } catch (error) {
      console.error("Error fetching platforms:", error)
    }
  }

  const fetchCoupons = async () => {
    setIsLoading(true)
    try {
      const data = await couponApi.getAll(1)
      setCoupons(data.results)
    } catch (error) {
      toast.error("Erreur lors du chargement")
    } finally {
      setIsLoading(false)
    }
  }

  const getPlatformName = (betAppId: string) => {
    const platform = platforms.find((p) => p.id === betAppId)
    return platform?.name || "Plateforme"
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success("Code copié!")
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500">Veuillez vous connecter</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mes Coupons</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{coupons.length} coupon(s)</p>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#3FA9FF] animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Ticket className="w-8 h-8 text-slate-400" />
          </div>
          <p className="font-medium text-slate-600 dark:text-slate-300">Aucun coupon</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 text-center">
            Vos coupons apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-violet-500/50 transition-colors"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                      {coupon.code}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {getPlatformName(coupon.bet_app)}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-medium">
                    Coupon
                  </span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Créé le</span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {format(new Date(coupon.created_at), "dd MMM yyyy", { locale: fr })}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(coupon.code)}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-violet-500 hover:text-white hover:border-violet-500 transition-colors"
                >
                  {copiedCode === coupon.code ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copié!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copier le code
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
