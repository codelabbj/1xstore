"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { TransactionProgressBar } from "@/components/transaction/progress-bar"
import { ConfirmationDialog } from "@/components/transaction/confirmation-dialog"
import { PlatformStep } from "@/components/transaction/steps/platform-step"
import { BetIdStep } from "@/components/transaction/steps/bet-id-step"
import { NetworkStep } from "@/components/transaction/steps/network-step"
import { PhoneStep } from "@/components/transaction/steps/phone-step"
import { AmountStep } from "@/components/transaction/steps/amount-step"
import { transactionApi, settingsApi } from "@/lib/api-client"
import type { Platform, UserAppId, Network, UserPhone, Transaction } from "@/lib/types"
import { toast } from "react-hot-toast"
import { extractTimeErrorMessage } from "@/lib/utils"
import { ChevronLeft, Copy, ArrowDownToLine, X } from "lucide-react"
import Link from "next/link"
import { TransactionSummaryDialog } from "@/components/transaction/transaction-summary-dialog"

export default function DepositPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

  // ── Pending transaction check (on mount) ─────────────────────────────────
  const [pendingTransaction, setPendingTransaction] = useState<Transaction | null>(null)
  const [isPendingCheckDone, setIsPendingCheckDone] = useState(false)
  const [isPendingDialogOpen, setIsPendingDialogOpen] = useState(false)

  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedBetId, setSelectedBetId] = useState<UserAppId | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [selectedPhone, setSelectedPhone] = useState<UserPhone | null>(null)
  const [amount, setAmount] = useState(0)

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isTransactionLinkModalOpen, setIsTransactionLinkModalOpen] = useState(false)
  const [transactionLink, setTransactionLink] = useState<string | null>(null)
  const [isNetworkUssdModalOpen, setIsNetworkUssdModalOpen] = useState(false)
  const [networkUssdCode, setNetworkUssdCode] = useState<string | null>(null)
  const [networkMerchantPhone, setNetworkMerchantPhone] = useState<string | null>(null)

  if (!user) {
    router.push("/login")
    return null
  }

  // ── Check pending transaction on mount ───────────────────────────────────
  useEffect(() => {
    const checkPendingTransaction = async () => {
      try {
        const lastTrans = await transactionApi.getLastTransaction()
        if (lastTrans && lastTrans.status === "pending" && lastTrans.type_trans === "deposit") {
          setPendingTransaction(lastTrans)
          setIsPendingDialogOpen(true)
        }
      } catch (error: any) {
        // 404 = aucune transaction, c'est normal
        if (error?.originalError?.response?.status !== 404) {
          console.error("Erreur vérification transaction en attente:", error)
        }
      } finally {
        setIsPendingCheckDone(true)
      }
    }
    checkPendingTransaction()
  }, [])

  // ── Flux partagé post-finalisation / post-création ────────────────────────
  const handlePostFinalization = async (data: any) => {
    if (data?.transaction_link) {
      setTransactionLink(data.transaction_link)
      setIsTransactionLinkModalOpen(true)
      return
    }
    const handled = await handleNetworkUssdFlow(amount)
    if (!handled) router.push("/dashboard")
  }

  // ── Handlers pending dialog ───────────────────────────────────────────────

  // "Nouveau dépôt" → annule l'ancienne, ferme le dialog, reste sur step 1
  const handleCancelPendingAndContinue = async (reference: string) => {
    try {
      await transactionApi.cancelTransaction(reference)
      toast.success("Ancienne transaction annulée")
      setIsPendingDialogOpen(false)
      setPendingTransaction(null)
      // ✅ Point 4 : signaler au dashboard de re-fetch (via focus event au retour)
      // Le dashboard a un useEffect sur focus qui appelle fetchRecentTransactions
    } catch (error: any) {
      const errorMessage =
        error?.originalError?.response?.data?.error ||
        error?.originalError?.response?.data?.detail ||
        error?.message ||
        "Erreur lors de l'annulation de la transaction"
      toast.error(errorMessage)
      throw error
    }
  }

  // "Finaliser" → finalise l'ancienne, enchaîne le flux post-finalisation
  const handleFinalizePending = async (reference: string) => {
    try {
      const finalizedTransaction = await transactionApi.finalizeTransaction(reference)
      setIsPendingDialogOpen(false)
      setPendingTransaction(null)
      await handlePostFinalization(finalizedTransaction)
    } catch (error) {
      throw error
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsConfirmationOpen(true)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const attemptDialerRedirect = (ussdCode: string) => {
    try {
      const link = document.createElement("a")
      link.href = `tel:${ussdCode}`
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link)
      }, 100)
    } catch (error) {
      console.error("Impossible d'ouvrir automatiquement le composeur:", error)
    }
  }

  const handleNetworkUssdFlow = async (amountValue: number) => {
    if (!selectedNetwork) return false
    if (!selectedNetwork.deposit_api || selectedNetwork.deposit_api.toLowerCase() !== "connect") return false

    const networkName = selectedNetwork.name?.toLowerCase()
    if (networkName !== "moov" && networkName !== "orange") return false

    try {
      const settings = await settingsApi.get()
      let merchantPhone: string | null = null
      let ussdCode: string | null = null
      const isBurkina = selectedNetwork.country_code?.toLowerCase() === "bf"

      if (networkName === "moov") {
        merchantPhone = isBurkina
          ? settings.bf_moov_marchand_phone
          : (settings.moov_merchant_phone || settings.moov_marchand_phone)
        if (!merchantPhone) return false
        const ussdAmount = Math.max(1, Math.floor(amountValue * 0.99))
        ussdCode = `*155*2*1*${merchantPhone}*${ussdAmount}#`
      } else if (networkName === "orange") {
        if (selectedNetwork.payment_by_link === true) return false
        merchantPhone = isBurkina
          ? settings.bf_orange_marchand_phone
          : settings.orange_marchand_phone
        if (!merchantPhone) return false
        ussdCode = `*144*2*1*${merchantPhone}*${amountValue}#`
      }

      if (merchantPhone && ussdCode) {
        setNetworkMerchantPhone(merchantPhone)
        setNetworkUssdCode(ussdCode)
        setIsNetworkUssdModalOpen(true)
        attemptDialerRedirect(ussdCode)
        return true
      }
      return false
    } catch (error) {
      console.error("Erreur lors de la récupération des paramètres réseau:", error)
      return false
    }
  }

  const handleCopyUssdCode = async () => {
    if (!networkUssdCode) return
    try {
      await navigator.clipboard.writeText(networkUssdCode)
      toast.success("Code USSD copié")
    } catch (error) {
      toast.error("Copie impossible")
    }
  }

  // ── Point 2 : plus de dialog de résumé post-création ─────────────────────
  const handleConfirmTransaction = async () => {
    if (!selectedPlatform || !selectedBetId || !selectedNetwork || !selectedPhone) {
      toast.error("Données manquantes pour la transaction")
      return
    }
    setIsSubmitting(true)
    try {
      const response = await transactionApi.createDeposit({
        amount,
        phone_number: selectedPhone.phone,
        app: selectedPlatform.id,
        user_app_id: selectedBetId.user_app_id,
        network: selectedNetwork.id,
        source: "web",
      })
      setIsConfirmationOpen(false)
      toast.success("Dépôt initié avec succès!")
      await handlePostFinalization(response)
    } catch (error: any) {
      const timeErrorMessage = extractTimeErrorMessage(error)
      toast.error(timeErrorMessage || "Erreur lors de la création du dépôt")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContinueTransaction = async () => {
    if (transactionLink) {
      window.open(transactionLink, "_blank", "noopener,noreferrer")
      setIsTransactionLinkModalOpen(false)
      setTransactionLink(null)
      router.push("/dashboard")
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return <PlatformStep selectedPlatform={selectedPlatform} onSelect={setSelectedPlatform} onNext={handleNext} type="deposit" />
      case 2: return <BetIdStep selectedPlatform={selectedPlatform} selectedBetId={selectedBetId} onSelect={setSelectedBetId} onNext={handleNext} />
      case 3: return <NetworkStep selectedNetwork={selectedNetwork} onSelect={setSelectedNetwork} onNext={handleNext} type="deposit" />
      case 4: return <PhoneStep selectedNetwork={selectedNetwork} selectedPhone={selectedPhone} onSelect={setSelectedPhone} onNext={handleNext} />
      case 5: return <AmountStep amount={amount} setAmount={setAmount} withdriwalCode="" setWithdriwalCode={() => {}} selectedPlatform={selectedPlatform} selectedBetId={selectedBetId} selectedNetwork={selectedNetwork} selectedPhone={selectedPhone} type="deposit" onNext={handleNext} />
      default: return null
    }
  }

  // ── Spinner pendant le check initial ─────────────────────────────────────
  if (!isPendingCheckDone) {
    return (
      <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-center min-h-100">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3FA9FF] border-t-transparent" />
          <p className="text-sm">Vérification en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ArrowDownToLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dépôt</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Étape {currentStep} sur {totalSteps}</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i < currentStep ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"}`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="p-5">{renderCurrentStep()}</div>
        {currentStep > 1 && (
          <div className="px-5 pb-5">
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={handleConfirmTransaction}
        transactionData={{ amount, phone_number: selectedPhone?.phone || "", app: selectedPlatform?.id || "", user_app_id: selectedBetId?.user_app_id || "", network: selectedNetwork?.id || 0 }}
        type="deposit"
        platformName={selectedPlatform?.name || ""}
        networkName={selectedNetwork?.public_name || ""}
        isLoading={isSubmitting}
      />

      {/* Transaction Link Modal */}
      {isTransactionLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
            <div className="p-5 text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Continuer</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Cliquez pour finaliser votre transaction</p>
            </div>
            <div className="p-5 pt-0 grid grid-cols-2 gap-3">
              <button
                onClick={() => { setIsTransactionLinkModalOpen(false); setTransactionLink(null); router.push("/dashboard") }}
                className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleContinueTransaction}
                className="h-11 rounded-xl bg-[#3FA9FF] text-white font-medium text-sm hover:bg-[#0066FF] transition-colors"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Point 3 : Network USSD Modal — bouton X et "J'ai compris" redirigent vers dashboard */}
      {isNetworkUssdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Transaction {selectedNetwork?.public_name || "Mobile"}
              </h3>
              <button
                onClick={() => { setIsNetworkUssdModalOpen(false); router.push("/dashboard") }}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Composez ce code USSD pour finaliser</p>
              {networkMerchantPhone && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Marchand</p>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white">{networkMerchantPhone}</p>
                </div>
              )}
              {networkUssdCode && (
                <div className="flex gap-2">
                  <input
                    value={networkUssdCode}
                    readOnly
                    className="flex-1 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleCopyUssdCode}
                    className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-[#3FA9FF] hover:border-[#3FA9FF] transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-5 pt-0">
              <button
                onClick={() => { setIsNetworkUssdModalOpen(false); router.push("/dashboard") }}
                className="w-full h-11 rounded-xl bg-[#3FA9FF] text-white font-medium text-sm hover:bg-[#0066FF] transition-colors"
              >
                J&apos;ai compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pending transaction dialog (au chargement) ── */}
      <TransactionSummaryDialog
        isOpen={isPendingDialogOpen}
        onClose={() => {}} // bloqué — l'utilisateur doit choisir
        transaction={pendingTransaction}
        onCancel={handleCancelPendingAndContinue}
        onFinalize={handleFinalizePending}
        isLoading={false}
        mode="pending"
      />
    </div>
  )
}