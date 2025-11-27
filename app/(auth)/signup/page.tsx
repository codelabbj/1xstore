"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { authApi, settingsApi } from "@/lib/api-client"
import { toast } from "react-hot-toast"
import { Loader2, Eye, EyeOff, User, Mail, Phone, Lock, Gift, ArrowRight, CheckCircle2 } from "lucide-react"

const baseSignupSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  re_password: z.string().min(6, "Confirmation requise"),
})

type SignupFormData = z.infer<typeof baseSignupSchema> & {
  referral_code?: string
}

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [referralBonusEnabled, setReferralBonusEnabled] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsApi.get()
        setReferralBonusEnabled(settings?.referral_bonus === true)
      } catch (error) {
        console.error("Error fetching settings:", error)
        setReferralBonusEnabled(false)
      } finally {
        setIsLoadingSettings(false)
      }
    }
    fetchSettings()
  }, [])

  const signupSchema = referralBonusEnabled
    ? baseSignupSchema
        .extend({
          referral_code: z.string().optional(),
        })
        .refine((data) => data.password === data.re_password, {
          message: "Les mots de passe ne correspondent pas",
          path: ["re_password"],
        })
    : baseSignupSchema.refine((data) => data.password === data.re_password, {
        message: "Les mots de passe ne correspondent pas",
        path: ["re_password"],
      })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const password = watch("password", "")
  
  // Password strength indicators
  const hasMinLength = password.length >= 6
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    try {
      const registrationData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        re_password: data.re_password,
      }
      
      if (referralBonusEnabled && data.referral_code) {
        registrationData.referral_code = data.referral_code
      }
      
      await authApi.register(registrationData)
      toast.success("Compte créé avec succès! Veuillez vous connecter.")
      router.push("/login")
    } catch (error) {
      console.error("Signup error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingSettings) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3FA9FF]/20 to-[#0077FF]/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#3FA9FF] animate-spin" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 sm:px-8 pt-8 pb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Créer un compte
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Rejoignez 1xstore et commencez vos transactions
        </p>
      </div>

      {/* Form */}
      <div className="px-6 sm:px-8 pb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name Fields - Two columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Prénom
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Jean"
                  {...register("first_name")}
                  disabled={isLoading}
                  className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#3FA9FF] focus:ring-4 focus:ring-[#3FA9FF]/10 outline-none transition-all duration-200 text-sm sm:text-base"
                />
              </div>
              {errors.first_name && (
                <p className="text-xs text-red-500">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nom
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Dupont"
                  {...register("last_name")}
                  disabled={isLoading}
                  className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#3FA9FF] focus:ring-4 focus:ring-[#3FA9FF]/10 outline-none transition-all duration-200 text-sm sm:text-base"
                />
              </div>
              {errors.last_name && (
                <p className="text-xs text-red-500">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
              type="email"
                placeholder="votre@email.com"
              {...register("email")}
              disabled={isLoading}
                className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#3FA9FF] focus:ring-4 focus:ring-[#3FA9FF]/10 outline-none transition-all duration-200 text-sm sm:text-base"
            />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Téléphone
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone className="w-5 h-5" />
              </div>
              <input
              type="tel"
              placeholder="+225 01 02 03 04 05"
              {...register("phone")}
              disabled={isLoading}
                className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#3FA9FF] focus:ring-4 focus:ring-[#3FA9FF]/10 outline-none transition-all duration-200 text-sm sm:text-base"
            />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoading}
                className="w-full h-12 sm:h-14 pl-12 pr-14 rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#3FA9FF] focus:ring-4 focus:ring-[#3FA9FF]/10 outline-none transition-all duration-200 text-sm sm:text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Password Strength Indicators */}
            {password && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className={`flex items-center gap-2 text-xs ${hasMinLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${hasMinLength ? 'opacity-100' : 'opacity-40'}`} />
                  6 caractères min
                </div>
                <div className={`flex items-center gap-2 text-xs ${hasUppercase ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${hasUppercase ? 'opacity-100' : 'opacity-40'}`} />
                  Une majuscule
                </div>
                <div className={`flex items-center gap-2 text-xs ${hasLowercase ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${hasLowercase ? 'opacity-100' : 'opacity-40'}`} />
                  Une minuscule
                </div>
                <div className={`flex items-center gap-2 text-xs ${hasNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${hasNumber ? 'opacity-100' : 'opacity-40'}`} />
                  Un chiffre
                </div>
              </div>
            )}
            
            {errors.password && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("re_password")}
                disabled={isLoading}
                className="w-full h-12 sm:h-14 pl-12 pr-14 rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#3FA9FF] focus:ring-4 focus:ring-[#3FA9FF]/10 outline-none transition-all duration-200 text-sm sm:text-base"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.re_password && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                {errors.re_password.message}
              </p>
            )}
          </div>

          {/* Referral Code Field (Conditional) */}
          {referralBonusEnabled && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#3FA9FF]" />
                Code de parrainage
                <span className="text-xs text-slate-400 font-normal">(optionnel)</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Gift className="w-5 h-5" />
                </div>
                <input
                type="text"
                  placeholder="Entrez le code de parrainage"
                {...register("referral_code")}
                disabled={isLoading}
                  className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#3FA9FF] focus:border-solid focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#3FA9FF]/10 outline-none transition-all duration-200 text-sm sm:text-base"
              />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#0077FF] to-[#3FA9FF] text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                Créer mon compte
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Terms */}
          {/* <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
            En créant un compte, vous acceptez nos{" "}
            <a href="#" className="text-[#3FA9FF] hover:underline">Conditions d'utilisation</a>
            {" "}et notre{" "}
            <a href="#" className="text-[#3FA9FF] hover:underline">Politique de confidentialité</a>
          </p> */}
        </form>
      </div>

      {/* Footer */}
      <div className="px-6 sm:px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
        <p className="text-center text-slate-600 dark:text-slate-400">
          Vous avez déjà un compte?{" "}
          <Link href="/login" className="font-semibold text-[#3FA9FF] hover:text-[#0077FF] transition-colors">
            Se connecter
          </Link>
        </p>
      </div>
        </div>
  )
}
