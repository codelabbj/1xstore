"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { authApi } from "@/lib/api-client"
import { toast } from "react-hot-toast"
import { Loader2, Eye, EyeOff, Mail, Lock, ArrowLeft, ArrowRight, Download } from "lucide-react"
import { setupNotifications } from "@/lib/fcm-helper"

const loginSchema = z.object({
  email_or_phone: z.string().min(1, "Email ou téléphone requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
})

type LoginFormData = z.infer<typeof loginSchema>

const forgotPasswordEmailSchema = z.object({
  email: z.string().email("Email invalide"),
})

const forgotPasswordOtpSchema = z.object({
  otp: z.string().min(4, "Le code OTP doit contenir au moins 4 caractères"),
})

const forgotPasswordNewPasswordSchema = z.object({
  new_password: z.string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  confirm_new_password: z.string(),
}).refine((data) => data.new_password === data.confirm_new_password, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm_new_password"],
})

type ForgotPasswordEmailFormData = z.infer<typeof forgotPasswordEmailSchema>
type ForgotPasswordOtpFormData = z.infer<typeof forgotPasswordOtpSchema>
type ForgotPasswordNewPasswordFormData = z.infer<typeof forgotPasswordNewPasswordSchema>

const APK_DOWNLOAD_URL = "/app-v1.0.1.apk"
const APK_FILE_NAME = "1xstore-v1.0.1.apk"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  
  // Forgot password states
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState("")
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const forgotPasswordEmailForm = useForm<ForgotPasswordEmailFormData>({
    resolver: zodResolver(forgotPasswordEmailSchema),
  })

  const forgotPasswordOtpForm = useForm<ForgotPasswordOtpFormData>({
    resolver: zodResolver(forgotPasswordOtpSchema),
  })

  const forgotPasswordNewPasswordForm = useForm<ForgotPasswordNewPasswordFormData>({
    resolver: zodResolver(forgotPasswordNewPasswordSchema),
  })

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remembered_email")
    const rememberedPassword = localStorage.getItem("remembered_password")
    if (rememberedEmail && rememberedPassword) {
      setValue("email_or_phone", rememberedEmail)
      setValue("password", rememberedPassword)
      setRememberMe(true)
    }
  }, [setValue])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      if (rememberMe) {
        localStorage.setItem("remembered_email", data.email_or_phone)
        localStorage.setItem("remembered_password", data.password)
      } else {
        localStorage.removeItem("remembered_email")
        localStorage.removeItem("remembered_password")
      }

      const response = await authApi.login(data.email_or_phone, data.password)
      login(response.access, response.refresh, response.data)
      toast.success("Connexion réussie!")
      
      try {
        const userId = response.data?.id
        if (userId) {
          await new Promise(resolve => setTimeout(resolve, 100))
          const fcmToken = await setupNotifications(userId)
          if (fcmToken) {
            toast.success("Notifications activées!")
          }
        }
      } catch (fcmError) {
        console.error('[Login] Error setting up notifications:', fcmError)
      }
      
      await new Promise(resolve => setTimeout(resolve, 300))
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPasswordEmailSubmit = async (data: ForgotPasswordEmailFormData) => {
    setIsForgotPasswordLoading(true)
    try {
      await authApi.sendOtp(data.email)
      setForgotPasswordEmail(data.email)
      toast.success("Code OTP envoyé à votre email")
      setForgotPasswordStep(2)
    } catch (error) {
      console.error("Send OTP error:", error)
    } finally {
      setIsForgotPasswordLoading(false)
    }
  }

  const handleForgotPasswordOtpSubmit = async (data: ForgotPasswordOtpFormData) => {
    setForgotPasswordOtp(data.otp)
    toast.success("Code OTP vérifié avec succès")
    setForgotPasswordStep(3)
  }

  const handleForgotPasswordNewPasswordSubmit = async (data: ForgotPasswordNewPasswordFormData) => {
    setIsForgotPasswordLoading(true)
    try {
      await authApi.resetPassword({
        otp: forgotPasswordOtp,
        new_password: data.new_password,
        confirm_new_password: data.confirm_new_password,
      })
      toast.success("Mot de passe réinitialisé avec succès")
      setIsForgotPassword(false)
      setForgotPasswordStep(1)
      setForgotPasswordEmail("")
      setForgotPasswordOtp("")
      forgotPasswordEmailForm.reset()
      forgotPasswordOtpForm.reset()
      forgotPasswordNewPasswordForm.reset()
    } catch (error) {
      console.error("Reset password error:", error)
    } finally {
      setIsForgotPasswordLoading(false)
    }
  }

  const renderForgotPasswordForm = () => {
    if (forgotPasswordStep === 1) {
      return (
        <form onSubmit={forgotPasswordEmailForm.handleSubmit(handleForgotPasswordEmailSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Adresse email
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
              type="email"
                placeholder="votre@email.com"
              {...forgotPasswordEmailForm.register("email")}
              disabled={isForgotPasswordLoading}
                className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#3FA9FF] focus:ring-4 focus:ring-[#3FA9FF]/10 outline-none transition-all duration-200"
            />
            </div>
            {forgotPasswordEmailForm.formState.errors.email && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                {forgotPasswordEmailForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isForgotPasswordLoading}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#0077FF] to-[#3FA9FF] text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isForgotPasswordLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                Envoyer le code
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsForgotPassword(false)
              setForgotPasswordStep(1)
              forgotPasswordEmailForm.reset()
            }}
            disabled={isForgotPasswordLoading}
            className="w-full h-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </button>
        </form>
      )
    }

    if (forgotPasswordStep === 2) {
      return (
        <form onSubmit={forgotPasswordOtpForm.handleSubmit(handleForgotPasswordOtpSubmit)} className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#3FA9FF]/20 to-[#0077FF]/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#3FA9FF]" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Un code a été envoyé à <span className="font-medium text-slate-700 dark:text-slate-300">{forgotPasswordEmail}</span>
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Code OTP
            </label>
            <input
              type="text"
              placeholder="Entrez le code à 6 chiffres"
              {...forgotPasswordOtpForm.register("otp")}
              disabled={isForgotPasswordLoading}
              className="w-full h-14 px-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center text-xl tracking-[0.5em] font-mono placeholder:text-slate-400 placeholder:tracking-normal placeholder:text-base focus:border-[#3FA9FF] focus:ring-4 focus:ring-[#3FA9FF]/10 outline-none transition-all duration-200"
            />
            {forgotPasswordOtpForm.formState.errors.otp && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                {forgotPasswordOtpForm.formState.errors.otp.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isForgotPasswordLoading}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#0077FF] to-[#3FA9FF] text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isForgotPasswordLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Vérifier
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setForgotPasswordStep(1)}
            disabled={isForgotPasswordLoading}
            className="w-full h-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </form>
      )
    }

    if (forgotPasswordStep === 3) {
      return (
        <form onSubmit={forgotPasswordNewPasswordForm.handleSubmit(handleForgotPasswordNewPasswordSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="••••••••"
                {...forgotPasswordNewPasswordForm.register("new_password")}
                disabled={isForgotPasswordLoading}
                className="w-full h-14 pl-12 pr-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#3FA9FF] focus:ring-4 focus:ring-[#3FA9FF]/10 outline-none transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {forgotPasswordNewPasswordForm.formState.errors.new_password && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                {forgotPasswordNewPasswordForm.formState.errors.new_password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showConfirmNewPassword ? "text" : "password"}
                placeholder="••••••••"
                {...forgotPasswordNewPasswordForm.register("confirm_new_password")}
                disabled={isForgotPasswordLoading}
                className="w-full h-14 pl-12 pr-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#3FA9FF] focus:ring-4 focus:ring-[#3FA9FF]/10 outline-none transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
              >
                {showConfirmNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {forgotPasswordNewPasswordForm.formState.errors.confirm_new_password && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                {forgotPasswordNewPasswordForm.formState.errors.confirm_new_password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isForgotPasswordLoading}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#0077FF] to-[#3FA9FF] text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isForgotPasswordLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Réinitialiser le mot de passe"
            )}
          </button>

          <button
            type="button"
            onClick={() => setForgotPasswordStep(2)}
            disabled={isForgotPasswordLoading}
            className="w-full h-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </form>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      {/* Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {isForgotPassword ? "Mot de passe oublié" : "Connexion"}
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {isForgotPassword
              ? forgotPasswordStep === 1
                ? "Entrez votre email pour recevoir un code"
                : forgotPasswordStep === 2
                ? "Vérifiez votre email"
                : "Créez un nouveau mot de passe"
                : " "
            }
          </p>
        </div>

        {/* Form */}
        <div className="px-6 sm:px-8 pb-8">
          {isForgotPassword ? (
            renderForgotPasswordForm()
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email/Phone Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email ou Téléphone
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                  type="text"
                    placeholder="votre@email.com ou +225..."
                  {...register("email_or_phone")}
                  disabled={isLoading}
                    className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#3FA9FF] focus:ring-4 focus:ring-[#3FA9FF]/10 outline-none transition-all duration-200"
                />
                </div>
                {errors.email_or_phone && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500" />
                    {errors.email_or_phone.message}
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
                    className="w-full h-14 pl-12 pr-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#3FA9FF] focus:ring-4 focus:ring-[#3FA9FF]/10 outline-none transition-all duration-200"
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
                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                    checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                      className="peer sr-only"
                  />
                    <div className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 peer-checked:border-[#3FA9FF] peer-checked:bg-[#3FA9FF] transition-all duration-200 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    Se souvenir de moi
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  disabled={isLoading}
                  className="text-sm font-medium text-[#3FA9FF] hover:text-[#0077FF] transition-colors"
                >
                  Mot de passe oublié?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#0077FF] to-[#3FA9FF] text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
          {!isForgotPassword && (
          <div className="px-6 sm:px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
            <p className="text-center text-slate-600 dark:text-slate-400">
              Pas encore de compte?{" "}
              <Link href="/signup" className="font-semibold text-[#3FA9FF] hover:text-[#0077FF] transition-colors">
                Créer un compte
              </Link>
            </p>
            </div>
          )}
      </div>

      {/* Download App */}
      <a
        href={APK_DOWNLOAD_URL}
        download={APK_FILE_NAME}
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
    </div>
  )
}
