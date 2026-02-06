"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SafeImage } from "@/components/ui/safe-image"
import { Loader2, Plus } from "lucide-react"
import { platformApi } from "@/lib/api-client"
import type { Platform } from "@/lib/types"
import { toast } from "react-hot-toast"

interface PlatformStepProps {
  selectedPlatform: Platform | null
  onSelect: (platform: Platform) => void
  onNext: () => void
  type: "deposit" | "withdrawal"
}

export function PlatformStep({ selectedPlatform, onSelect, onNext, type }: PlatformStepProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const data = await platformApi.getAll(type)
        // Filter only enabled platforms
        const enabledPlatforms = data.filter(platform => platform.enable)
        setPlatforms(enabledPlatforms)
      } catch (error) {
        toast.error("Erreur lors du chargement des plateformes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlatforms()
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

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
        <CardTitle className="text-base sm:text-lg font-semibold">Choisir une plateforme</CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-1">Sélectionnez la plateforme de paris</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <div className="grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => (
            <Card
              key={platform.id}
              className={`group cursor-pointer transition-all duration-200 border-2 overflow-hidden ${selectedPlatform?.id === platform.id
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md shadow-emerald-500/10"
                  : "border-border/50 hover:border-border hover:shadow-sm bg-card"
                }`}
              onClick={() => {
                onSelect(platform)
                setTimeout(() => {
                  onNext()
                }, 300)
              }}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-3 min-w-0">
                  <SafeImage
                    src={platform.image}
                    alt={platform.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl object-cover flex-shrink-0 ring-1 ring-border/50"
                    fallbackText={platform.name.charAt(0).toUpperCase()}
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{platform.name}</h3>
                    {(platform.city || platform.street) && (
                      <div className="text-[11px] sm:text-xs text-muted-foreground space-y-0.5">
                        {platform.city && (
                          <p className="truncate">
                            <span className="font-medium">Ville:</span> {platform.city}
                          </p>
                        )}
                        {platform.street && (
                          <p className="truncate">
                            <span className="font-medium">Rue:</span> {platform.street}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Badge variant="secondary" className="text-[10px] sm:text-xs font-medium">
                        Min: {platform.minimun_deposit.toLocaleString()} FCFA
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs font-medium">
                        Max: {platform.max_deposit.toLocaleString()} FCFA
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {platforms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Aucune plateforme disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
