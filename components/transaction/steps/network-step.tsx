"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SafeImage } from "@/components/ui/safe-image"
import { Loader2 } from "lucide-react"
import { networkApi } from "@/lib/api-client"
import type { Network } from "@/lib/types"
import { TRANSACTION_TYPES, getTransactionTypeLabel } from "@/lib/constants"

interface NetworkStepProps {
  selectedNetwork: Network | null
  onSelect: (network: Network) => void
  onNext: () => void
  type: "deposit" | "withdrawal"
}

export function NetworkStep({ selectedNetwork, onSelect, onNext, type }: NetworkStepProps) {
  const [networks, setNetworks] = useState<Network[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await networkApi.getAll(type)
        // Filter networks based on transaction type
        const activeNetworks = data.filter(network =>
          type === TRANSACTION_TYPES.DEPOSIT ? network.active_for_deposit : network.active_for_with
        )
        setNetworks(activeNetworks)
      } catch (error) {
        console.error("Error fetching networks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNetworks()
  }, [type])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  const isDeposit = type === TRANSACTION_TYPES.DEPOSIT
  const accentColor = isDeposit ? "emerald" : "orange"

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
        <CardTitle className="text-base sm:text-lg font-semibold">Choisir un réseau</CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-1">
          Sélectionnez votre opérateur mobile
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <div className="grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {networks.map((network) => (
            <Card
              key={network.id}
              className={`group cursor-pointer transition-all duration-200 border-2 overflow-hidden ${selectedNetwork?.id === network.id
                  ? isDeposit
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md shadow-emerald-500/10"
                    : "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-md shadow-orange-500/10"
                  : "border-border/50 hover:border-border hover:shadow-sm bg-card"
                }`}
              onClick={() => {
                onSelect(network)
                setTimeout(() => {
                  onNext()
                }, 300)
              }}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-3 min-w-0">
                  <SafeImage
                    src={network.image}
                    alt={network.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl object-cover flex-shrink-0 ring-1 ring-border/50"
                    fallbackText={network.public_name.charAt(0).toUpperCase()}
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{network.public_name}</h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{network.name}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {network.active_for_deposit && (
                        <Badge
                          variant={isDeposit ? "default" : "secondary"}
                          className={`text-[10px] sm:text-xs font-medium ${isDeposit ? "bg-emerald-500 hover:bg-emerald-600" : ""
                            }`}
                        >
                          {getTransactionTypeLabel(TRANSACTION_TYPES.DEPOSIT)}
                        </Badge>
                      )}
                      {network.active_for_with && (
                        <Badge
                          variant={!isDeposit ? "default" : "secondary"}
                          className={`text-[10px] sm:text-xs font-medium ${!isDeposit ? "bg-orange-500 hover:bg-orange-600" : ""
                            }`}
                        >
                          {getTransactionTypeLabel(TRANSACTION_TYPES.WITHDRAWAL)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {networks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground break-words">
              Aucun réseau disponible pour {type === TRANSACTION_TYPES.DEPOSIT ? "les dépôts" : "les retraits"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
