"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import type { Platform, UserAppId, Network, UserPhone } from "@/lib/types"
import { formatPhoneNumberForDisplay } from "@/lib/utils"

interface AmountStepProps {
  amount: number
  setAmount: (amount: number) => void
  withdriwalCode: string
  setWithdriwalCode: (code: string) => void
  selectedPlatform: Platform | null
  selectedBetId: UserAppId | null
  selectedNetwork: Network | null
  selectedPhone: UserPhone | null
  type: "deposit" | "withdrawal"
  onNext: () => void
}

export function AmountStep({
  amount,
  setAmount,
  withdriwalCode,
  setWithdriwalCode,
  selectedPlatform,
  selectedBetId,
  selectedNetwork,
  selectedPhone,
  type,
  onNext
}: AmountStepProps) {
  const [errors, setErrors] = useState<{ amount?: string; withdriwalCode?: string }>({})

  const validateAmount = (value: number) => {
    if (!selectedPlatform) return "Plateforme non sélectionnée"
    if (value <= 0) return "Le montant doit être supérieur à 0"
    
    const minAmount = type === "deposit" ? selectedPlatform.minimun_deposit : selectedPlatform.minimun_with
    const maxAmount = type === "deposit" ? selectedPlatform.max_deposit : selectedPlatform.max_win
    
    if (value < minAmount) return `Le montant minimum est ${minAmount.toLocaleString()} FCFA`
    if (value > maxAmount) return `Le montant maximum est ${maxAmount.toLocaleString()} FCFA`
    
    return null
  }

  const validateWithdriwalCode = (code: string) => {
    if (type === "withdrawal" && code.length < 4) {
      return "Le code de retrait doit contenir au moins 4 caractères"
    }
    return null
  }

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    setAmount(numValue)
    
    const error = validateAmount(numValue)
    setErrors(prev => ({ ...prev, amount: error || undefined }))
  }

  const handleWithdriwalCodeChange = (value: string) => {
    setWithdriwalCode(value)
    
    const error = validateWithdriwalCode(value)
    setErrors(prev => ({ ...prev, withdriwalCode: error || undefined }))
  }

  const isFormValid = () => {
    const amountError = validateAmount(amount)
    const withdriwalCodeError = type === "withdrawal" ? validateWithdriwalCode(withdriwalCode) : null
    
    return !amountError && !withdriwalCodeError && 
           selectedPlatform && selectedBetId && selectedNetwork && selectedPhone
  }

  if (!selectedPlatform || !selectedBetId || !selectedNetwork || !selectedPhone) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Veuillez compléter les étapes précédentes</p>
        </CardContent>
      </Card>
    )
  }

  const minAmount = type === "deposit" ? selectedPlatform.minimun_deposit : selectedPlatform.minimun_with
  const maxAmount = type === "deposit" ? selectedPlatform.max_deposit : selectedPlatform.max_win

  const isDeposit = type === "deposit"
  const accentColor = isDeposit ? "emerald" : "orange"

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Transaction Summary */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
          <CardTitle className="text-base sm:text-lg font-semibold">Résumé de la transaction</CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-1">Vérifiez les informations avant de continuer</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex justify-between items-center gap-3 py-1.5">
              <span className="text-xs sm:text-sm text-muted-foreground">Type</span>
              <Badge 
                className={`text-xs sm:text-sm font-semibold ${
                  isDeposit 
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                {isDeposit ? "Dépôt" : "Retrait"}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center gap-3 py-1.5">
              <span className="text-xs sm:text-sm text-muted-foreground">Plateforme</span>
              <span className="font-medium text-xs sm:text-sm text-right break-words text-foreground">{selectedPlatform.name}</span>
            </div>
            
            {!isDeposit && (
              <div className="flex justify-between items-center gap-3 py-1.5">
                <span className="text-xs sm:text-sm text-muted-foreground">Moyen de retrait</span>
                <span className="font-medium text-xs sm:text-sm text-right break-words text-foreground">1xespece</span>
              </div>
            )}
            
            {selectedPlatform.city && (
              <div className="flex justify-between items-center gap-3 py-1.5">
                <span className="text-xs sm:text-sm text-muted-foreground">Ville</span>
                <span className="font-medium text-xs sm:text-sm text-right break-words text-foreground">
                  {selectedPlatform.city}
                </span>
              </div>
            )}
            
            {selectedPlatform.street && (
              <div className="flex justify-between items-center gap-3 py-1.5">
                <span className="text-xs sm:text-sm text-muted-foreground">Rue</span>
                <span className="font-medium text-xs sm:text-sm text-right break-words text-foreground">
                  {selectedPlatform.street}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center gap-3 py-1.5">
              <span className="text-xs sm:text-sm text-muted-foreground">ID pari</span>
              <span className="font-medium text-xs sm:text-sm text-right break-all font-mono text-foreground">{selectedBetId.user_app_id}</span>
            </div>
            
            <div className="flex justify-between items-center gap-3 py-1.5">
              <span className="text-xs sm:text-sm text-muted-foreground">Réseau</span>
              <span className="font-medium text-xs sm:text-sm text-right break-words text-foreground">{selectedNetwork.public_name}</span>
            </div>
            
            <div className="flex justify-between items-center gap-3 py-1.5">
              <span className="text-xs sm:text-sm text-muted-foreground">Téléphone</span>
              <span className="font-medium text-xs sm:text-sm text-right break-all font-mono text-foreground">{formatPhoneNumberForDisplay(selectedPhone.phone)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Message */}
      {selectedNetwork && (() => {
        const message = isDeposit 
          ? selectedNetwork.deposit_message 
          : selectedNetwork.withdrawal_message
        
        if (!message || message.trim() === "") return null
        
        return (
          <Card className={`border-border/50 overflow-hidden ${isDeposit ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/50" : "bg-orange-50/30 dark:bg-orange-950/10 border-orange-200/50"}`}>
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap break-words leading-relaxed">
                {message}
              </p>
            </CardContent>
          </Card>
        )
      })()}

      {/* Amount Input */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold">Montant de la transaction</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                {isDeposit ? "Entrez le montant à déposer" : "Entrez le montant à retirer"}
              </CardDescription>
            </div>
            {selectedPlatform && (() => {
              const tutorialLink = isDeposit ? selectedPlatform.deposit_tuto_link : selectedPlatform.withdrawal_tuto_link
              if (!tutorialLink) return null
              return (
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm border-border/50"
                >
                  <a href={tutorialLink} target="_blank" rel="noopener noreferrer">
                    {isDeposit ? "Comment déposer ?" : "Comment retirer ?"}
                  </a>
                </Button>
              )
            })()}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="space-y-3">
            <div>
              <Label htmlFor="amount" className="text-xs sm:text-sm font-medium mb-2 block">
                Montant (FCFA)
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount || ""}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder={`Min: ${minAmount.toLocaleString()} - Max: ${maxAmount.toLocaleString()}`}
                className={`h-11 sm:h-12 text-base sm:text-lg font-semibold ${errors.amount ? "border-destructive" : ""}`}
              />
              {errors.amount && (
                <p className="text-xs text-destructive mt-1.5 break-words">{errors.amount}</p>
              )}
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-2">
                Montant minimum: <span className="font-medium">{minAmount.toLocaleString()} FCFA</span> • 
                Maximum: <span className="font-medium">{maxAmount.toLocaleString()} FCFA</span>
              </p>
            </div>
            
            {amount > 0 && (
              <div className={`p-3.5 sm:p-4 rounded-lg border-2 ${
                isDeposit 
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50" 
                  : "bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/50"
              }`}>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Montant saisi</p>
                <p className={`text-xl sm:text-2xl font-bold ${
                  isDeposit ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"
                }`}>
                  {amount.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "XOF",
                    minimumFractionDigits: 0,
                  })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Code (only for withdrawals) */}
      {!isDeposit && (
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
            <CardTitle className="text-base sm:text-lg font-semibold">Code de retrait</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">Entrez le code de retrait de votre compte</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div>
              <Label htmlFor="withdriwalCode" className="text-xs sm:text-sm font-medium mb-2 block">
                Code de retrait
              </Label>
              <Input
                id="withdriwalCode"
                type="text"
                value={withdriwalCode}
                onChange={(e) => handleWithdriwalCodeChange(e.target.value)}
                placeholder="Entrez votre code de retrait"
                className={`h-11 sm:h-12 text-base font-semibold ${errors.withdriwalCode ? "border-destructive" : ""}`}
              />
              {errors.withdriwalCode && (
                <p className="text-xs text-destructive mt-1.5 break-words">{errors.withdriwalCode}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-2">
        <Button 
          onClick={onNext} 
          disabled={!isFormValid()}
          className={`w-full sm:w-auto min-w-[140px] h-11 sm:h-12 text-sm sm:text-base font-semibold ${
            isDeposit 
              ? "bg-emerald-500 hover:bg-emerald-600" 
              : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          Continuer
        </Button>
      </div>
    </div>
  )
}
