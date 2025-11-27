"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { TransactionProgressBar } from "@/components/transaction/progress-bar"
import { ConfirmationDialog } from "@/components/transaction/confirmation-dialog"
import { PlatformStep } from "@/components/transaction/steps/platform-step"
import { BetIdStep } from "@/components/transaction/steps/bet-id-step"
import { NetworkStep } from "@/components/transaction/steps/network-step"
import { PhoneStep } from "@/components/transaction/steps/phone-step"
import { AmountStep } from "@/components/transaction/steps/amount-step"
import { transactionApi } from "@/lib/api-client"
import type { Platform, UserAppId, Network, UserPhone } from "@/lib/types"
import { toast } from "react-hot-toast"
import { extractTimeErrorMessage } from "@/lib/utils"
import { ChevronLeft, ArrowUpFromLine } from "lucide-react"
import Link from "next/link"

export default function WithdrawalPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5
  
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedBetId, setSelectedBetId] = useState<UserAppId | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [selectedPhone, setSelectedPhone] = useState<UserPhone | null>(null)
  const [amount, setAmount] = useState(0)
  const [withdriwalCode, setWithdriwalCode] = useState("")
  
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user) {
    router.push("/login")
    return null
  }

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

  const handleConfirmTransaction = async () => {
    if (!selectedPlatform || !selectedBetId || !selectedNetwork || !selectedPhone) {
      toast.error("Données manquantes pour la transaction")
      return
    }

    setIsSubmitting(true)
    try {
      await transactionApi.createWithdrawal({
        amount,
        phone_number: selectedPhone.phone,
        app: selectedPlatform.id,
        user_app_id: selectedBetId.user_app_id,
        network: selectedNetwork.id,
        withdriwal_code: withdriwalCode,
        source: "web"
      })
      toast.success("Retrait initié avec succès!")
      router.push("/dashboard")
    } catch (error: any) {
      const timeErrorMessage = extractTimeErrorMessage(error)
      toast.error(timeErrorMessage || "Erreur lors de la création du retrait")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return <PlatformStep selectedPlatform={selectedPlatform} onSelect={setSelectedPlatform} onNext={handleNext} />
      case 2: return <BetIdStep selectedPlatform={selectedPlatform} selectedBetId={selectedBetId} onSelect={setSelectedBetId} onNext={handleNext} />
      case 3: return <NetworkStep selectedNetwork={selectedNetwork} onSelect={setSelectedNetwork} onNext={handleNext} type="withdrawal" />
      case 4: return <PhoneStep selectedNetwork={selectedNetwork} selectedPhone={selectedPhone} onSelect={setSelectedPhone} onNext={handleNext} />
      case 5: return <AmountStep amount={amount} setAmount={setAmount} withdriwalCode={withdriwalCode} setWithdriwalCode={setWithdriwalCode} selectedPlatform={selectedPlatform} selectedBetId={selectedBetId} selectedNetwork={selectedNetwork} selectedPhone={selectedPhone} type="withdrawal" onNext={handleNext} />
      default: return null
    }
  }

  return (
    <div className="max-w-lg mx-auto">
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
            <ArrowUpFromLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Retrait</h1>
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
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < currentStep ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="p-5">
          {renderCurrentStep()}
        </div>
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
        transactionData={{ amount, phone_number: selectedPhone?.phone || "", app: selectedPlatform?.id || "", user_app_id: selectedBetId?.user_app_id || "", network: selectedNetwork?.id || 0, withdriwal_code: withdriwalCode }}
        type="withdrawal"
        platformName={selectedPlatform?.name || ""}
        networkName={selectedNetwork?.public_name || ""}
        isLoading={isSubmitting}
      />
    </div>
  )
}
