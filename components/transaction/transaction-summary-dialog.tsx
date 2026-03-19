"use client"

import { useState } from "react"
import { Loader2, AlertCircle, Clock, X } from "lucide-react"
import { toast } from "react-hot-toast"
import type { Transaction } from "@/lib/types"

interface TransactionSummaryDialogProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  onCancel: (reference: string) => Promise<void>
  onFinalize: (reference: string) => Promise<void>
  isLoading?: boolean
  /**
   * "pending" → affiché au chargement quand un dépôt précédent est en attente.
   *   - Boutons : "Nouveau dépôt" (annule l'ancien) | "Finaliser"
   *   - Non fermable (pas de X, pas de clic extérieur)
   *
   * "created" → affiché après création (conservé pour compatibilité).
   *   - Boutons : "Annuler" | "Finaliser"
   *   - Fermable normalement.
   */
  mode?: "pending" | "created"
}

export function TransactionSummaryDialog({
  isOpen,
  onClose,
  transaction,
  onCancel,
  onFinalize,
  isLoading = false,
  mode = "created",
}: TransactionSummaryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionType, setActionType] = useState<"cancel" | "finalize" | null>(null)

  if (!isOpen || !transaction) return null

  const isPendingMode = mode === "pending"

  // ── "Nouveau dépôt" (mode pending) ────────────────────────────────────────
  const handleNewDeposit = async () => {
    if (!transaction.reference) { toast.error("Référence de transaction manquante"); return }
    setActionType("cancel")
    setIsSubmitting(true)
    try {
      await onCancel(transaction.reference)
      // onCancel gère le toast + fermeture
    } catch (error: any) {
      const errorMessage =
        error?.originalError?.response?.data?.error ||
        error?.originalError?.response?.data?.detail ||
        error?.message ||
        "Erreur lors de l'annulation"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
      setActionType(null)
    }
  }

  // ── "Annuler" (mode created) ───────────────────────────────────────────────
  const handleCancel = async () => {
    if (!transaction.reference) { toast.error("Référence de transaction manquante"); return }
    setActionType("cancel")
    setIsSubmitting(true)
    try {
      await onCancel(transaction.reference)
      toast.success("Transaction annulée avec succès")
      onClose()
    } catch (error: any) {
      const errorMessage =
        error?.originalError?.response?.data?.error ||
        error?.originalError?.response?.data?.detail ||
        error?.message ||
        "Erreur lors de l'annulation"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
      setActionType(null)
    }
  }

  // ── "Finaliser" (les deux modes) ──────────────────────────────────────────
  const handleFinalize = async () => {
    if (!transaction.reference) { toast.error("Référence de transaction manquante"); return }
    setActionType("finalize")
    setIsSubmitting(true)
    try {
      await onFinalize(transaction.reference)
      toast.success("Transaction finalisée avec succès")
      onClose()
    } catch (error: any) {
      const errorMessage =
        error?.originalError?.response?.data?.error ||
        error?.originalError?.response?.data?.detail ||
        error?.message ||
        "Erreur lors de la finalisation"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
      setActionType(null)
    }
  }

  // ✅ Point 5 : case "annuler" ajouté
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      accept:  "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      reject:  "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      cancel:  "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
      annuler: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
      timeout: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    }
    const labels: Record<string, string> = {
      pending: "En attente",
      accept:  "Acceptée",
      reject:  "Rejetée",
      cancel:  "Annulée",
      annuler: "Annulée",
      timeout: "Expirée",
    }
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                {isPendingMode ? "Transaction en attente" : "Récapitulatif"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isPendingMode
                  ? "Finalisez ou créez un nouveau dépôt"
                  : "Transaction créée"}
              </p>
            </div>
          </div>
          {/* Bouton X uniquement en mode created */}
          {!isPendingMode && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">Statut</span>
            {getStatusBadge(transaction.status)}
          </div>

          {/* Reference */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <p className="text-xs text-slate-400 mb-1">Référence</p>
            <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white break-all">
              {transaction.reference}
            </p>
          </div>

          {/* Amount */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Montant</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {transaction.amount.toLocaleString("fr-FR", {
                style: "currency",
                currency: "XOF",
                minimumFractionDigits: 0,
              })}
            </p>
          </div>

          {/* Phone */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">Téléphone</span>
            <span className="font-medium text-slate-900 dark:text-white">{transaction.phone_number}</span>
          </div>

          {/* Message */}
          {transaction.message && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-300">Message</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">{transaction.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* USSD Code */}
          {transaction.ussd_code && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-300">Code USSD</p>
                  <p className="text-sm font-mono text-amber-700 dark:text-amber-400 mt-1 break-all">{transaction.ussd_code}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 grid grid-cols-2 gap-3">
          {isPendingMode ? (
            // ── Mode pending : "Nouveau dépôt" | "Finaliser" ─────────────────
            <>
              <button
                onClick={handleNewDeposit}
                disabled={isSubmitting || isLoading || transaction.status !== "pending"}
                className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && actionType === "cancel" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Annulation...</>
                ) : "Nouveau dépôt"}
              </button>
              <button
                onClick={handleFinalize}
                disabled={isSubmitting || isLoading || transaction.status !== "pending"}
                className="h-11 rounded-xl bg-[#3FA9FF] text-white font-medium text-sm hover:bg-[#0066FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && actionType === "finalize" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Finalisation...</>
                ) : "Finaliser"}
              </button>
            </>
          ) : (
            // ── Mode created : "Annuler" | "Finaliser" ────────────────────────
            <>
              <button
                onClick={handleCancel}
                disabled={isSubmitting || isLoading || transaction.status !== "pending"}
                className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && actionType === "cancel" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Annulation...</>
                ) : "Annuler"}
              </button>
              <button
                onClick={handleFinalize}
                disabled={isSubmitting || isLoading || transaction.status !== "pending"}
                className="h-11 rounded-xl bg-[#3FA9FF] text-white font-medium text-sm hover:bg-[#0066FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && actionType === "finalize" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Finalisation...</>
                ) : "Finaliser"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}