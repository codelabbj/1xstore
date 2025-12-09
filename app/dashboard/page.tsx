"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ArrowDownToLine, ArrowUpFromLine, Wallet, Loader2, Send, Download, Ticket, MessageCircleMore, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, Gift } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { transactionApi, advertisementApi, settingsApi } from "@/lib/api-client"
import type { Transaction, Advertisement } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { formatPhoneNumberForDisplay } from "@/lib/utils"

export default function DashboardPage() {
  const { user } = useAuth()
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [isLoadingAd, setIsLoadingAd] = useState(true)
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [referralBonusEnabled, setReferralBonusEnabled] = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState("")
  const [telegram, setTelegram] = useState("")

  useEffect(() => {
    window.history.replaceState(null, "", window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const fetchRecentTransactions = async () => {
    try {
      setIsLoadingTransactions(true)
      const data = await transactionApi.getHistory({ page: 1, page_size: 5 })
      setRecentTransactions(data.results)
    } catch (error) {
      console.error("Error fetching recent transactions:", error)
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const fetchAdvertisement = async () => {
    try {
      setIsLoadingAd(true)
      const response = await advertisementApi.get()
      if (response?.results && Array.isArray(response.results)) {
        const enabledAds = response.results.filter(
          (ad: Advertisement) => ad.enable === true && (ad.image || ad.image_url)
        )
        setAdvertisements(enabledAds)
      }
    } catch (error) {
      console.error("Error fetching advertisement:", error)
    } finally {
      setIsLoadingAd(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const settings = await settingsApi.get()
      setReferralBonusEnabled(settings?.referral_bonus === true)
      setWhatsappPhone(settings?.whatsapp_phone || "")
      setTelegram(settings?.telegram || "")
    } catch (error) {
      console.error("Error fetching settings:", error)
      setReferralBonusEnabled(false)
      setWhatsappPhone("")
      setTelegram("")
    }
  }

  useEffect(() => {
    if (user) {
      fetchRecentTransactions()
      fetchAdvertisement()
      fetchSettings()
    }
  }, [user])

  useEffect(() => {
    if (advertisements.length <= 1) return
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % advertisements.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [advertisements.length])

  const getStatusConfig = (status: Transaction["status"]) => {
    const configs: Record<string, { icon: any; color: string; bg: string; label: string }> = {
      pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "En attente" },
      accept: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Accepté" },
      init_payment: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "En attente" },
      error: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Erreur" },
      reject: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Rejeté" },
      timeout: { icon: AlertCircle, color: "text-slate-500", bg: "bg-slate-500/10", label: "Expiré" },
    }
    return configs[status] || configs.timeout
  }

  const currentAd = advertisements[currentAdIndex]

  return (
    <div className="space-y-6">
      {/* Welcome Section - Compact */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Bonjour 👋</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            {user?.first_name} {user?.last_name}
          </h1>
        </div>
      </div>

      {/* Advertisement Banner */}
      {!isLoadingAd && (currentAd || advertisements.length === 0) && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0066FF] to-[#3FA9FF] aspect-[3/1]">
          {currentAd ? (
            <>
              <Image
                src={currentAd.image_url || currentAd.image || ""}
                alt={currentAd.title || "Publicité"}
                fill
                className="object-cover"
              />
              {(currentAd.url || currentAd.link) && (
                <a
                  href={currentAd.url || currentAd.link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0"
                />
              )}
              {advertisements.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {advertisements.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentAdIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${idx === currentAdIndex ? 'bg-white w-5' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="font-medium opacity-80">Espace publicitaire</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions - Cards */}
      <div className={`grid gap-2 sm:gap-4 ${referralBonusEnabled ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <Link href="/dashboard/deposit" className="group">
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all h-full flex flex-col items-center sm:items-start">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-1.5 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
              <ArrowDownToLine className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white text-[11px] sm:text-base text-center sm:text-left">Dépôt</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">Recharger</p>
          </div>
        </Link>

        <Link href="/dashboard/withdrawal" className="group">
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all h-full flex flex-col items-center sm:items-start">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-1.5 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/20">
              <ArrowUpFromLine className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white text-[11px] sm:text-base text-center sm:text-left">Retrait</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">Récupérer</p>
          </div>
        </Link>

        <Link href="/dashboard/coupon" className="group">
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10 transition-all h-full flex flex-col items-center sm:items-start">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center mb-1.5 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/20">
              <Ticket className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white text-[11px] sm:text-base text-center sm:text-left">Coupon</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">Code promo</p>
          </div>
        </Link>

        {referralBonusEnabled && (
          <Link href="/dashboard/bonus" className="group">
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 border border-slate-200 dark:border-slate-800 hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/10 transition-all h-full flex flex-col items-center sm:items-start">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center mb-1.5 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/20">
                <Gift className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="font-semibold text-slate-900 dark:text-white text-[11px] sm:text-base text-center sm:text-left">Bonus</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">Parrainage</p>
            </div>
          </Link>
        )}
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Transactions récentes
          </h2>
          <Link
            href="/dashboard/history"
            className="flex items-center gap-1 text-sm font-medium text-[#3FA9FF] hover:text-[#0066FF] transition-colors"
          >
            Voir tout
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {isLoadingTransactions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#3FA9FF] animate-spin" />
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Wallet className="w-7 h-7 text-slate-400" />
              </div>
              <p className="font-medium text-slate-600 dark:text-slate-300">Aucune transaction</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Effectuez votre premier dépôt
              </p>
              <Link
                href="/dashboard/deposit"
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#3FA9FF] text-white font-medium text-sm hover:bg-[#0066FF] transition-colors"
              >
                Faire un dépôt
              </Link>
            </div>
          ) : (
            <div>
              {recentTransactions.map((transaction, index) => {
                const statusConfig = getStatusConfig(transaction.status)
                const StatusIcon = statusConfig.icon
                const isDeposit = transaction.type_trans === "deposit"
                
                return (
                  <div 
                    key={transaction.id}
                    className={`flex items-center gap-4 p-4 ${
                      index !== recentTransactions.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isDeposit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {isDeposit ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {isDeposit ? 'Dépôt' : 'Retrait'}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {transaction.app_details?.name || transaction.app} • {format(new Date(transaction.created_at), "dd MMM, HH:mm", { locale: fr })}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold ${isDeposit ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {isDeposit ? '+' : '−'}{transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">FCFA</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Download App */}
      <a
        href="/app-v1.0.1.apk"
        download="1xstore-v1.0.1.apk"
        className="bg-slate-800/80 dark:bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 hover:bg-slate-700/80 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
      >
        <div className="w-8 h-8 rounded-lg bg-[#3FA9FF]/20 flex items-center justify-center flex-shrink-0">
          <Download className="w-4 h-4 text-[#3FA9FF]" />
        </div>
        <p className="flex-1 text-sm text-slate-300">Télécharger l'app</p>
        <span className="px-3 py-1.5 rounded-lg bg-[#3FA9FF] text-white text-xs font-medium">
          APK
        </span>
      </a>

      {/* Floating Support Button */}
      <div className="fixed right-4 bottom-6 z-40">
        {isChatOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsChatOpen(false)} />
            <div className="absolute right-0 bottom-full mb-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Support</p>
              </div>
              <div className="p-2">
                <a
                  href={`https://wa.me/${whatsappPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#25D366] flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">WhatsApp</span>
                </a>
                <a
                  href={telegram.startsWith('http') ? telegram : `https://t.me/${telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#0088cc] flex items-center justify-center text-white">
                    <Send className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">Telegram</span>
                </a>
              </div>
            </div>
          </>
        )}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
            isChatOpen 
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' 
              : 'bg-[#3FA9FF] text-white shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105'
          }`}
        >
          {isChatOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <MessageCircleMore className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  )
}
