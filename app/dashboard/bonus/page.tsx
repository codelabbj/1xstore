"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Gift, ChevronLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { bonusApi, settingsApi } from "@/lib/api-client"
import type { Bonus } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function BonusPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [referralBonusEnabled, setReferralBonusEnabled] = useState(false)

  useEffect(() => {
    const checkSettings = async () => {
      try {
        const settings = await settingsApi.get()
        const enabled = settings?.referral_bonus === true
        setReferralBonusEnabled(enabled)
        
        if (!enabled) {
          router.push("/dashboard")
          return
        }
        fetchBonuses()
      } catch (error) {
        setReferralBonusEnabled(false)
        router.push("/dashboard")
      } finally {
        setIsLoadingSettings(false)
      }
    }
    if (user) checkSettings()
  }, [user, router])

  const fetchBonuses = async () => {
    setIsLoading(true)
    try {
      const data = await bonusApi.getAll(1)
      setBonuses(data.results)
    } catch (error) {
      toast.error("Erreur lors du chargement")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!referralBonusEnabled) return
    const handleFocus = () => fetchBonuses()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [referralBonusEnabled])

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#3FA9FF] animate-spin" />
      </div>
    )
  }

  if (!referralBonusEnabled) return null

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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mes bonus</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{bonuses.length} bonus reçu(s)</p>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#3FA9FF] animate-spin" />
        </div>
      ) : bonuses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-slate-400" />
          </div>
          <p className="font-medium text-slate-600 dark:text-slate-300">Aucun bonus</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 text-center">
            Vos bonus de parrainage apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bonuses.map((bonus) => (
            <div
              key={bonus.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:border-amber-500/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {bonus.reason_bonus || "Bonus de parrainage"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {format(new Date(bonus.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-lg text-amber-500">
                    +{parseFloat(bonus.amount).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400">FCFA</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
