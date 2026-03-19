"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle } from "lucide-react"
import { toast } from "react-hot-toast"
import { formatPhoneNumberForDisplay } from "@/lib/utils"

interface TransactionData {
  amount: number
  phone_number: string
  app: string
  user_app_id: string
  network: number
  withdriwal_code?: string
}

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  transactionData: TransactionData
  type: "deposit" | "withdrawal"
  platformName: string
  networkName: string
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  transactionData,
  type,
  platformName,
  networkName,
  isLoading = false
}: ConfirmationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
      toast.success(
        type === "deposit" 
          ? "Dépôt initié avec succès!" 
          : "Retrait initié avec succès!"
      )
      onClose()
    } catch (error) {
      toast.error("Une erreur est survenue lors de la transaction")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-purple-600" />
            Confirmer {type === "deposit" ? "le dépôt" : "le retrait"}
          </DialogTitle>
          <DialogDescription>
            Vérifiez les détails de votre transaction avant de confirmer
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Détails de la transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant={type === "deposit" ? "default" : "secondary"}>
                {type === "deposit" ? "Dépôt" : "Retrait"}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Montant</span>
              <span className="font-semibold">
                {transactionData.amount.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "XOF",
                  minimumFractionDigits: 0,
                })}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Plateforme</span>
              <span className="font-medium">{platformName}</span>
            </div>

            {type === "withdrawal" && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Moyen de retrait</span>
                <span className="font-medium">1xespece</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ID de pari</span>
              <span className="font-medium">{transactionData.user_app_id}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Réseau</span>
              <span className="font-medium">{networkName}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Numéro de téléphone</span>
              <span className="font-medium">{formatPhoneNumberForDisplay(transactionData.phone_number)}</span>
            </div>
            
            {type === "withdrawal" && transactionData.withdriwal_code && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Code de retrait</span>
                  <span className="font-medium">{transactionData.withdriwal_code}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isSubmitting || isLoading}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              "Confirmer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
