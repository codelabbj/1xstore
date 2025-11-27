"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { phoneApi, userAppIdApi, networkApi, platformApi } from "@/lib/api-client"
import type { UserPhone, UserAppId, Network, Platform } from "@/lib/types"
import { toast } from "react-hot-toast"
import { Loader2, Phone, Plus, Trash2, Edit, Smartphone, ChevronLeft, X, Check } from "lucide-react"
import Link from "next/link"
import { formatPhoneNumberForDisplay } from "@/lib/utils"

const COUNTRY_OPTIONS = [
  { label: "Burkina Faso", value: "bf", prefix: "+226" },
  { label: "Sénégal", value: "sn", prefix: "+221" },
  { label: "Bénin", value: "bj", prefix: "+229" },
  { label: "Côte d'Ivoire", value: "ci", prefix: "+225" },
]

const DEFAULT_COUNTRY_VALUE = "ci"

const buildInternationalPhone = (input: string, countryValue: string) => {
  const country = COUNTRY_OPTIONS.find(option => option.value === countryValue)
  if (!country) return input.trim()
  let sanitized = input.trim().replace(/\s+/g, "")
  if (!sanitized) return `${country.prefix}`
  if (sanitized.startsWith(country.prefix)) sanitized = sanitized.slice(country.prefix.length)
  else {
    const numericPrefix = country.prefix.replace("+", "")
    if (sanitized.startsWith(numericPrefix)) sanitized = sanitized.slice(numericPrefix.length)
  }
  if (sanitized.startsWith("+")) sanitized = sanitized.slice(1)
  return `${country.prefix}${sanitized}`
}

const parsePhoneByCountry = (phone: string) => {
  const sanitized = phone.replace(/\s+/g, "")
  for (const country of COUNTRY_OPTIONS) {
    if (sanitized.startsWith(country.prefix)) {
      return { countryValue: country.value, localNumber: sanitized.slice(country.prefix.length) }
    }
  }
  return { countryValue: DEFAULT_COUNTRY_VALUE, localNumber: sanitized }
}

const phoneSchema = z.object({ phone: z.string().min(8, "Numéro invalide"), network: z.number().min(1, "Réseau requis") })
const appIdSchema = z.object({ user_app_id: z.string().min(1, "ID requis"), app: z.string().min(1, "Plateforme requise") })

type PhoneFormData = z.infer<typeof phoneSchema>
type AppIdFormData = z.infer<typeof appIdSchema>

export default function PhonesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [userPhones, setUserPhones] = useState<UserPhone[]>([])
  const [userAppIds, setUserAppIds] = useState<UserAppId[]>([])
  const [networks, setNetworks] = useState<Network[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [isAppIdModalOpen, setIsAppIdModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPhone, setEditingPhone] = useState<UserPhone | null>(null)
  const [editingAppId, setEditingAppId] = useState<UserAppId | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: "phone" | "appId"; id: number } | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string>(DEFAULT_COUNTRY_VALUE)
  const [editingCountry, setEditingCountry] = useState<string>(DEFAULT_COUNTRY_VALUE)
  const [activeTab, setActiveTab] = useState<'phones' | 'betIds'>('phones')
  const [isSearching, setIsSearching] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [searchResult, setSearchResult] = useState<{ name: string; userId: number; currencyId: number } | null>(null)
  const [pendingBetId, setPendingBetId] = useState<{ appId: string; betId: string } | null>(null)

  const phoneForm = useForm<PhoneFormData>({ resolver: zodResolver(phoneSchema) })
  const appIdForm = useForm<AppIdFormData>({ resolver: zodResolver(appIdSchema) })

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    const handleFocus = () => loadData()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [phonesData, networksData, platformsData] = await Promise.all([
        phoneApi.getAll(), networkApi.getAll(), platformApi.getAll()
      ])
      setUserPhones(phonesData)
      setNetworks(networksData)
      setPlatforms(platformsData)
      try { const appIds = await userAppIdApi.getAll(); setUserAppIds(appIds) } catch {}
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneSubmit = async (data: PhoneFormData) => {
    setIsSubmitting(true)
    try {
      const countryValue = editingPhone ? editingCountry : selectedCountry
      const phoneWithPrefix = buildInternationalPhone(data.phone, countryValue)
      if (editingPhone) {
        await phoneApi.update(editingPhone.id, phoneWithPrefix, data.network)
        toast.success("Numéro modifié!")
      } else {
        await phoneApi.create(phoneWithPrefix, data.network)
        toast.success("Numéro ajouté!")
      }
      setIsPhoneModalOpen(false)
      phoneForm.reset()
      setEditingPhone(null)
      loadData()
    } catch (error) {
      toast.error("Erreur")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAppIdSubmit = async (data: AppIdFormData) => {
    if (editingAppId) {
      setIsSubmitting(true)
      try {
        await userAppIdApi.update(editingAppId.id, data.user_app_id, data.app)
        toast.success("ID modifié!")
        setIsAppIdModalOpen(false)
        appIdForm.reset()
        setEditingAppId(null)
        loadData()
      } catch { toast.error("Erreur") }
      finally { setIsSubmitting(false) }
      return
    }

    setIsSearching(true)
    try {
      const response = await userAppIdApi.searchUser(data.app, data.user_app_id)
      if (response.UserId === 0) {
        setErrorMessage("Utilisateur non trouvé avec cet ID.")
        setIsErrorModalOpen(true)
        setIsAppIdModalOpen(false)
        return
      }
      if (response.CurrencyId !== 27) {
        setErrorMessage("Cet utilisateur n'utilise pas la devise XOF.")
        setIsErrorModalOpen(true)
        setIsAppIdModalOpen(false)
        return
      }
      setSearchResult({ name: response.Name, userId: response.UserId, currencyId: response.CurrencyId })
      setPendingBetId({ appId: data.app, betId: data.user_app_id })
      setIsAppIdModalOpen(false)
      setIsConfirmModalOpen(true)
    } catch (error: any) {
      let errorMsg = "Erreur lors de la recherche"
      if (error.response?.status === 400) {
        const d = error.response.data
        if (d.user_app_id) errorMsg = Array.isArray(d.user_app_id) ? d.user_app_id[0] : d.user_app_id
        else if (d.app) errorMsg = Array.isArray(d.app) ? d.app[0] : d.app
        else if (d.detail || d.error || d.message) errorMsg = d.detail || d.error || d.message
      }
      setErrorMessage(errorMsg)
      setIsErrorModalOpen(true)
      setIsAppIdModalOpen(false)
    } finally {
      setIsSearching(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === "phone") {
        await phoneApi.delete(deleteTarget.id)
        toast.success("Numéro supprimé!")
      } else {
        await userAppIdApi.delete(deleteTarget.id)
        toast.success("ID supprimé!")
      }
      setDeleteTarget(null)
      loadData()
    } catch { toast.error("Erreur") }
  }

  const handleConfirmAddBetId = async () => {
    if (!pendingBetId) return
    setIsSubmitting(true)
    try {
      await userAppIdApi.create(pendingBetId.betId, pendingBetId.appId)
      toast.success("ID ajouté!")
      setIsConfirmModalOpen(false)
      setPendingBetId(null)
      setSearchResult(null)
      appIdForm.reset()
      loadData()
    } catch (error: any) {
      let errorMsg = "Erreur lors de l'ajout"
      if (error.response?.status === 400) {
        const d = error.response.data
        if (d.user_app_id) errorMsg = Array.isArray(d.user_app_id) ? d.user_app_id[0] : d.user_app_id
        else if (d.detail || d.error || d.message) errorMsg = d.detail || d.error || d.message
      }
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditPhone = (phone: UserPhone) => {
    const { countryValue, localNumber } = parsePhoneByCountry(phone.phone)
    setEditingPhone(phone)
    setEditingCountry(countryValue)
    phoneForm.reset({ phone: localNumber, network: phone.network })
    setIsPhoneModalOpen(true)
  }

  const openEditAppId = (appId: UserAppId) => {
    setEditingAppId(appId)
    appIdForm.reset({ user_app_id: appId.user_app_id, app: appId.app?.toString() || "" })
    setIsAppIdModalOpen(true)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3FA9FF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mes numéros & IDs</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gérez vos informations</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('phones')} className={`flex-1 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === 'phones' ? 'bg-[#3FA9FF] text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
          Numéros ({userPhones.length})
        </button>
        <button onClick={() => setActiveTab('betIds')} className={`flex-1 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === 'betIds' ? 'bg-[#3FA9FF] text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
          IDs de pari ({userAppIds.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#3FA9FF] animate-spin" />
        </div>
      ) : activeTab === 'phones' ? (
        <div className="space-y-3">
          <button onClick={() => { setEditingPhone(null); phoneForm.reset(); setIsPhoneModalOpen(true) }} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium text-sm flex items-center justify-center gap-2 hover:border-[#3FA9FF] hover:text-[#3FA9FF] transition-colors">
            <Plus className="w-4 h-4" /> Ajouter un numéro
          </button>
          {userPhones.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center py-12 px-4">
              <Smartphone className="w-10 h-10 text-slate-400 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">Aucun numéro enregistré</p>
            </div>
          ) : userPhones.map((phone) => (
            <div key={phone.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3FA9FF]/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-[#3FA9FF]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white">{formatPhoneNumberForDisplay(phone.phone)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{networks.find(n => n.id === phone.network)?.name || "Réseau"}</p>
              </div>
              <button onClick={() => openEditPhone(phone)} className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-[#3FA9FF]/10 hover:text-[#3FA9FF] transition-colors">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => setDeleteTarget({ type: "phone", id: phone.id })} className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <button onClick={() => { setEditingAppId(null); appIdForm.reset(); setIsAppIdModalOpen(true) }} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium text-sm flex items-center justify-center gap-2 hover:border-[#3FA9FF] hover:text-[#3FA9FF] transition-colors">
            <Plus className="w-4 h-4" /> Ajouter un ID de pari
          </button>
          {userAppIds.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center py-12 px-4">
              <Smartphone className="w-10 h-10 text-slate-400 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">Aucun ID enregistré</p>
            </div>
          ) : userAppIds.map((appId) => (
            <div key={appId.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white">{appId.user_app_id}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{appId.app_details?.name || platforms.find(p => p.id === appId.app)?.name || "Plateforme"}</p>
              </div>
              <button onClick={() => openEditAppId(appId)} className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-[#3FA9FF]/10 hover:text-[#3FA9FF] transition-colors">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => setDeleteTarget({ type: "appId", id: appId.id })} className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Phone Modal */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingPhone ? "Modifier" : "Ajouter"} un numéro</h2>
              <button onClick={() => { setIsPhoneModalOpen(false); setEditingPhone(null); phoneForm.reset() }} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Numéro</label>
                <div className="flex gap-2">
                  <select value={editingPhone ? editingCountry : selectedCountry} onChange={e => editingPhone ? setEditingCountry(e.target.value) : setSelectedCountry(e.target.value)} className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm">
                    {COUNTRY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.prefix}</option>)}
                  </select>
                  <input {...phoneForm.register("phone")} placeholder="07 12 34 56 78" className="flex-1 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-[#3FA9FF] focus:ring-2 focus:ring-[#3FA9FF]/20 outline-none" />
                </div>
                {phoneForm.formState.errors.phone && <p className="text-xs text-red-500 mt-1">{phoneForm.formState.errors.phone.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Réseau</label>
                <select {...phoneForm.register("network", { valueAsNumber: true })} defaultValue={editingPhone?.network || ""} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-[#3FA9FF] focus:ring-2 focus:ring-[#3FA9FF]/20 outline-none">
                  <option value="">Choisir un réseau</option>
                  {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
                {phoneForm.formState.errors.network && <p className="text-xs text-red-500 mt-1">{phoneForm.formState.errors.network.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl bg-[#3FA9FF] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#0066FF] transition-colors disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingPhone ? "Modifier" : "Ajouter"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* App ID Modal */}
      {isAppIdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingAppId ? "Modifier" : "Ajouter"} un ID</h2>
              <button onClick={() => { setIsAppIdModalOpen(false); setEditingAppId(null); appIdForm.reset() }} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={appIdForm.handleSubmit(handleAppIdSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Plateforme</label>
                <select {...appIdForm.register("app")} defaultValue={editingAppId?.app?.toString() || ""} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-[#3FA9FF] focus:ring-2 focus:ring-[#3FA9FF]/20 outline-none">
                  <option value="">Choisir une plateforme</option>
                  {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {appIdForm.formState.errors.app && <p className="text-xs text-red-500 mt-1">{appIdForm.formState.errors.app.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">ID de pari</label>
                <input {...appIdForm.register("user_app_id")} placeholder="Votre ID" className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-[#3FA9FF] focus:ring-2 focus:ring-[#3FA9FF]/20 outline-none" />
                {appIdForm.formState.errors.user_app_id && <p className="text-xs text-red-500 mt-1">{appIdForm.formState.errors.user_app_id.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting || isSearching} className="w-full h-12 rounded-xl bg-[#3FA9FF] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#0066FF] transition-colors disabled:opacity-50">
                {isSubmitting || isSearching ? <><Loader2 className="w-5 h-5 animate-spin" />{isSearching ? "Recherche..." : ""}</> : editingAppId ? "Modifier" : "Ajouter"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Supprimer?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Annuler</button>
              <button onClick={handleDelete} className="flex-1 h-11 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {isConfirmModalOpen && searchResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-5">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 text-center">Utilisateur trouvé</h2>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-5">
              <p className="text-sm"><span className="text-slate-500">Nom:</span> <span className="font-medium text-slate-900 dark:text-white">{searchResult.name}</span></p>
              <p className="text-sm mt-1"><span className="text-slate-500">ID:</span> <span className="font-medium text-slate-900 dark:text-white">{searchResult.userId}</span></p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setIsConfirmModalOpen(false); setPendingBetId(null); setSearchResult(null) }} disabled={isSubmitting} className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium text-sm">Annuler</button>
              <button onClick={handleConfirmAddBetId} disabled={isSubmitting} className="flex-1 h-11 rounded-xl bg-[#3FA9FF] text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {isErrorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Erreur</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{errorMessage}</p>
            <button onClick={() => { setIsErrorModalOpen(false); setErrorMessage("") }} className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}
