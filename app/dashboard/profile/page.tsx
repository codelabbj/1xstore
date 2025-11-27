"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, User, Save, Eye, EyeOff, Lock, ChevronLeft, Calendar, Gift, LogOut } from "lucide-react"
import Link from "next/link"
import { authApi } from "@/lib/api-client"
import type { User as UserType } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const profileSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
})

const passwordSchema = z.object({
  old_password: z.string().min(1, "L'ancien mot de passe est requis"),
  new_password: z.string().min(6, "Min 6 caractères"),
  confirm_new_password: z.string().min(6, "Confirmation requise"),
}).refine((data) => data.new_password === data.confirm_new_password, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm_new_password"],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const router = useRouter()
  const { user: authUser, login, logout } = useAuth()
  const [profile, setProfile] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: passwordErrors }, reset: resetPassword } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    if (!authUser) { router.push("/login"); return }
    fetchProfile()
  }, [authUser, router])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const userData = await authApi.getProfile()
      setProfile(userData)
      reset({ first_name: userData.first_name || "", last_name: userData.last_name || "", email: userData.email || "", phone: userData.phone || "" })
    } catch (error) {
      toast.error("Erreur lors du chargement du profil")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true)
    try {
      const updatedUser = await authApi.updateProfile(data)
      setProfile(updatedUser)
      if (authUser) {
        login(localStorage.getItem("access_token") || "", localStorage.getItem("refresh_token") || "", updatedUser)
      }
      toast.success("Profil mis à jour!")
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true)
    try {
      await authApi.changePassword({ old_password: data.old_password, new_password: data.new_password, confirm_new_password: data.confirm_new_password })
      toast.success("Mot de passe modifié!")
      resetPassword()
    } catch (error) {
      toast.error("Erreur lors de la modification")
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (!authUser) return null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#3FA9FF] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3FA9FF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mon profil</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gérez vos informations</p>
          </div>
        </div>
      </div>

      {/* User Card */}
      <div className="bg-gradient-to-br from-[#3FA9FF] to-[#0066FF] rounded-2xl p-5 mb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile?.first_name} {profile?.last_name}</h2>
            <p className="text-white/80 text-sm">{profile?.email}</p>
          </div>
        </div>
        {profile?.referral_code && (
          <div className="mt-4 p-3 bg-white/10 rounded-xl">
            <p className="text-xs text-white/70 mb-1">Code de parrainage</p>
            <p className="font-mono font-bold">{profile.referral_code}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === 'profile' ? 'bg-[#3FA9FF] text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
          Informations
        </button>
        <button onClick={() => setActiveTab('password')} className={`flex-1 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === 'password' ? 'bg-[#3FA9FF] text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
          Mot de passe
        </button>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        {activeTab === 'profile' ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Prénom</label>
                <input {...register("first_name")} disabled={isSubmitting} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#3FA9FF] focus:ring-2 focus:ring-[#3FA9FF]/20 outline-none text-sm" />
                {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Nom</label>
                <input {...register("last_name")} disabled={isSubmitting} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#3FA9FF] focus:ring-2 focus:ring-[#3FA9FF]/20 outline-none text-sm" />
                {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Email</label>
              <input {...register("email")} type="email" disabled={isSubmitting} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#3FA9FF] focus:ring-2 focus:ring-[#3FA9FF]/20 outline-none text-sm" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Téléphone</label>
              <input {...register("phone")} type="tel" disabled={isSubmitting} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#3FA9FF] focus:ring-2 focus:ring-[#3FA9FF]/20 outline-none text-sm" />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl bg-[#3FA9FF] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#0066FF] transition-colors disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Enregistrer</>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Ancien mot de passe</label>
              <div className="relative">
                <input {...registerPassword("old_password")} type={showOldPassword ? "text" : "password"} disabled={isChangingPassword} className="w-full h-11 px-4 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#3FA9FF] focus:ring-2 focus:ring-[#3FA9FF]/20 outline-none text-sm" />
                <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
              </div>
              {passwordErrors.old_password && <p className="text-xs text-red-500 mt-1">{passwordErrors.old_password.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Nouveau mot de passe</label>
              <div className="relative">
                <input {...registerPassword("new_password")} type={showNewPassword ? "text" : "password"} disabled={isChangingPassword} className="w-full h-11 px-4 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#3FA9FF] focus:ring-2 focus:ring-[#3FA9FF]/20 outline-none text-sm" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
              </div>
              {passwordErrors.new_password && <p className="text-xs text-red-500 mt-1">{passwordErrors.new_password.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Confirmer</label>
              <div className="relative">
                <input {...registerPassword("confirm_new_password")} type={showConfirmPassword ? "text" : "password"} disabled={isChangingPassword} className="w-full h-11 px-4 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#3FA9FF] focus:ring-2 focus:ring-[#3FA9FF]/20 outline-none text-sm" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
              </div>
              {passwordErrors.confirm_new_password && <p className="text-xs text-red-500 mt-1">{passwordErrors.confirm_new_password.message}</p>}
            </div>
            <button type="submit" disabled={isChangingPassword} className="w-full h-12 rounded-xl bg-[#3FA9FF] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#0066FF] transition-colors disabled:opacity-50">
              {isChangingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-5 h-5" /> Modifier</>}
            </button>
          </form>
        )}
      </div>

      {/* Account Info */}
      {profile && (
        <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Informations du compte</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">Inscrit le</span>
              <span className="ml-auto font-medium text-slate-900 dark:text-white">{format(new Date(profile.date_joined), "dd MMM yyyy", { locale: fr })}</span>
            </div>
            {profile.bonus_available !== undefined && (
              <div className="flex items-center gap-3 text-sm">
                <Gift className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Bonus</span>
                <span className="ml-auto font-medium text-emerald-500">{profile.bonus_available.toLocaleString()} FCFA</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logout Button */}
      <button
        onClick={logout}
        className="mt-6 w-full h-12 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-medium flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Se déconnecter
      </button>
    </div>
  )
}
