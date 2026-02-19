"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  Loader2,
  Gift,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  Wallet,
  ArrowRight,
  X,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { bonusApi, settingsApi, platformApi, userAppIdApi, authApi, bonusTransactionApi } from "@/lib/api-client"
import type { Bonus, Platform, UserAppId, User } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function BonusPage() {
  const router = useRouter()
  const { user } = useAuth()

  // Gate check
  const [referralBonusEnabled, setReferralBonusEnabled] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)

  // Live user profile (for bonus_available balance)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Bonus history
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [isLoadingBonuses, setIsLoadingBonuses] = useState(true)

  // Platforms & BetIds
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [betIds, setBetIds] = useState<UserAppId[]>([])
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(false)
  const [isLoadingBetIds, setIsLoadingBetIds] = useState(false)

  // Form state
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedBetId, setSelectedBetId] = useState<UserAppId | null>(null)
  const [amount, setAmount] = useState("")

  // UI state
  const [isPlatformOpen, setIsPlatformOpen] = useState(false)
  const [isBetIdOpen, setIsBetIdOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bonusAvailable = userProfile?.bonus_available ?? 0

  // ────────────────────────────────────────────
  // Initial load: check settings gate
  // ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const init = async () => {
      try {
        const settings = await settingsApi.get()
        const enabled = settings?.referral_bonus === true
        setReferralBonusEnabled(enabled)
        if (!enabled) {
          router.push("/dashboard")
          return
        }
        // Parallel load
        await Promise.all([fetchProfile(), fetchBonuses(), fetchPlatforms()])
      } catch {
        router.push("/dashboard")
      } finally {
        setIsLoadingSettings(false)
      }
    }
    init()
  }, [user, router])

  // Reload on window focus
  useEffect(() => {
    if (!referralBonusEnabled) return
    const handleFocus = () => {
      fetchProfile()
      fetchBonuses()
    }
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [referralBonusEnabled])

  // When platform changes, reset bet ID and fetch new bet IDs
  useEffect(() => {
    setSelectedBetId(null)
    setBetIds([])
    if (!selectedPlatform) return
    fetchBetIds(selectedPlatform.id)
  }, [selectedPlatform])

  // ────────────────────────────────────────────
  // Data fetching
  // ────────────────────────────────────────────
  const fetchProfile = async () => {
    setIsLoadingProfile(true)
    try {
      const data = await authApi.getProfile()
      setUserProfile(data)
    } catch {
      // silent
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const fetchBonuses = async () => {
    setIsLoadingBonuses(true)
    try {
      const data = await bonusApi.getAll(1)
      setBonuses(data.results)
    } catch {
      // silent
    } finally {
      setIsLoadingBonuses(false)
    }
  }

  const fetchPlatforms = async () => {
    setIsLoadingPlatforms(true)
    try {
      const data = await platformApi.getAll("deposit")
      setPlatforms(data.filter((p) => p.enable))
    } catch {
      // silent
    } finally {
      setIsLoadingPlatforms(false)
    }
  }

  const fetchBetIds = async (platformId: string) => {
    setIsLoadingBetIds(true)
    try {
      const data = await userAppIdApi.getByPlatform(platformId)
      setBetIds(data)
    } catch {
      // silent
    } finally {
      setIsLoadingBetIds(false)
    }
  }

  // ────────────────────────────────────────────
  // Form validation
  // ────────────────────────────────────────────
  const validateForm = (): boolean => {
    if (!selectedPlatform) {
      toast.error("Veuillez sélectionner une plateforme")
      return false
    }
    if (!selectedBetId) {
      toast.error("Veuillez sélectionner votre ID de pari")
      return false
    }
    const amountNum = Number(amount)
    if (!amount || amountNum <= 0) {
      toast.error("Veuillez saisir un montant valide")
      return false
    }
    if (amountNum > bonusAvailable) {
      toast.error(`Le montant dépasse votre solde bonus (${bonusAvailable.toLocaleString()} FCFA)`)
      return false
    }
    return true
  }

  const handleSubmitClick = () => {
    if (validateForm()) {
      setIsConfirmOpen(true)
    }
  }

  // ────────────────────────────────────────────
  // API call
  // ────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!selectedPlatform || !selectedBetId) return
    setIsSubmitting(true)
    try {
      await bonusTransactionApi.create({
        app: selectedPlatform.id,
        user_app_id: selectedBetId.user_app_id,
        amount: Number(amount),
      })
      toast.success("Transaction bonus créée avec succès!")
      // Reset form
      setSelectedPlatform(null)
      setSelectedBetId(null)
      setAmount("")
      setIsConfirmOpen(false)
      // Refresh balance + history
      await Promise.all([fetchProfile(), fetchBonuses()])
    } catch {
      // error toast shown by api.ts interceptor
    } finally {
      setIsSubmitting(false)
    }
  }

  // ────────────────────────────────────────────
  // Loading / gate states
  // ────────────────────────────────────────────
  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#3FA9FF] animate-spin" />
      </div>
    )
  }

  if (!referralBonusEnabled) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
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
            <p className="text-sm text-slate-500 dark:text-slate-400">Parrainage & Récompenses</p>
          </div>
        </div>
      </div>

      {/* ── Balance Card ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 opacity-80" />
            <p className="text-sm opacity-80 font-medium">Solde bonus disponible</p>
          </div>
          {isLoadingProfile ? (
            <Loader2 className="w-6 h-6 animate-spin mt-1" />
          ) : (
            <p className="text-3xl font-bold tracking-tight">
              {bonusAvailable.toLocaleString()}
              <span className="text-lg font-semibold ml-1 opacity-80">FCFA</span>
            </p>
          )}
          <p className="text-xs opacity-60 mt-2">
            {bonuses.length} bonus reçu(s) au total
          </p>
        </div>
      </div>

      {/* ── Transaction Form (only if bonus > 0) ── */}
      {!isLoadingProfile && bonusAvailable > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">Convertir en crédit de pari</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Transférez votre bonus vers votre compte sur une plateforme
            </p>
          </div>

          <div className="p-4 space-y-4">

            {/* Platform selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Plateforme</label>
              <div className="relative">
                <button
                  onClick={() => { setIsPlatformOpen(!isPlatformOpen); setIsBetIdOpen(false) }}
                  disabled={isLoadingPlatforms}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between text-sm text-slate-700 dark:text-slate-200 hover:border-amber-400 transition-colors disabled:opacity-50"
                >
                  {isLoadingPlatforms ? (
                    <span className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
                    </span>
                  ) : selectedPlatform ? (
                    <span className="flex items-center gap-2">
                      {selectedPlatform.image && (
                        <Image src={selectedPlatform.image} alt={selectedPlatform.name} width={20} height={20} className="rounded-md object-contain" />
                      )}
                      <span className="font-medium">{selectedPlatform.name}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">Sélectionner une plateforme</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isPlatformOpen ? "rotate-180" : ""}`} />
                </button>

                {isPlatformOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                    {platforms.length === 0 ? (
                      <p className="p-4 text-sm text-slate-400 text-center">Aucune plateforme disponible</p>
                    ) : (
                      platforms.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPlatform(p); setIsPlatformOpen(false) }}
                          className={`w-full px-4 py-3 flex items-center gap-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left ${selectedPlatform?.id === p.id ? "bg-amber-50 dark:bg-amber-900/20" : ""}`}
                        >
                          {p.image && (
                            <Image src={p.image} alt={p.name} width={24} height={24} className="rounded-md object-contain flex-shrink-0" />
                          )}
                          <span className="font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
                          {selectedPlatform?.id === p.id && <CheckCircle2 className="w-4 h-4 text-amber-500 ml-auto" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bet ID selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">ID de pari</label>
              <div className="relative">
                <button
                  onClick={() => { if (selectedPlatform) { setIsBetIdOpen(!isBetIdOpen); setIsPlatformOpen(false) } }}
                  disabled={!selectedPlatform || isLoadingBetIds}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between text-sm text-slate-700 dark:text-slate-200 hover:border-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingBetIds ? (
                    <span className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
                    </span>
                  ) : selectedBetId ? (
                    <span className="font-medium">{selectedBetId.user_app_id}</span>
                  ) : (
                    <span className="text-slate-400">
                      {selectedPlatform ? "Sélectionner votre ID" : "Choisir d'abord une plateforme"}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isBetIdOpen ? "rotate-180" : ""}`} />
                </button>

                {isBetIdOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                    {betIds.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-slate-400">Aucun ID enregistré pour cette plateforme</p>
                        <Link
                          href="/dashboard/phones"
                          className="mt-2 inline-block text-xs font-medium text-amber-500 hover:underline"
                        >
                          Ajouter un ID →
                        </Link>
                      </div>
                    ) : (
                      betIds.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => { setSelectedBetId(b); setIsBetIdOpen(false) }}
                          className={`w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${selectedBetId?.id === b.id ? "bg-amber-50 dark:bg-amber-900/20" : ""}`}
                        >
                          <span className="font-medium text-slate-700 dark:text-slate-200">{b.user_app_id}</span>
                          {selectedBetId?.id === b.id && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Amount input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Montant</label>
                <button
                  onClick={() => setAmount(String(bonusAvailable))}
                  className="text-xs font-medium text-amber-500 hover:text-amber-600 transition-colors"
                >
                  Max: {bonusAvailable.toLocaleString()} FCFA
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={1}
                  max={bonusAvailable}
                  placeholder="Saisir le montant"
                  className="w-full h-12 px-4 pr-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">FCFA</span>
              </div>
              {Number(amount) > bonusAvailable && bonusAvailable > 0 && (
                <p className="text-xs text-red-500">Le montant dépasse votre solde disponible</p>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmitClick}
              disabled={!selectedPlatform || !selectedBetId || !amount}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
            >
              Convertir le bonus
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Bonus History ── */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Historique des bonus</h2>
        {isLoadingBonuses ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center py-12">
            <Loader2 className="w-7 h-7 text-[#3FA9FF] animate-spin" />
          </div>
        ) : bonuses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <Gift className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-medium text-slate-600 dark:text-slate-300">Aucun bonus</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 text-center">
              Vos bonus de parrainage apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {bonuses.map((bonus, index) => (
              <div
                key={bonus.id}
                className={`flex items-center gap-4 p-4 ${index !== bonuses.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""}`}
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">
                    {bonus.reason_bonus || "Bonus de parrainage"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {format(new Date(bonus.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-amber-500">+{parseFloat(bonus.amount).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">FCFA</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Confirmation Dialog ── */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Confirmer la transaction</h3>
              <button
                onClick={() => setIsConfirmOpen(false)}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary */}
            <div className="p-4 space-y-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Plateforme</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedPlatform?.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">ID de pari</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">{selectedBetId?.user_app_id}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Montant</span>
                  <span className="font-bold text-lg text-amber-500">{Number(amount).toLocaleString()} FCFA</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                Ce montant sera déduit de votre solde bonus disponible.
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 pt-0 grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsConfirmOpen(false)}
                disabled={isSubmitting}
                className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="h-11 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 shadow-md shadow-orange-500/20"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Confirmer <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
