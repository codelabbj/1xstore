"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Search, RefreshCw, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight, History } from "lucide-react"
import Link from "next/link"
import { transactionApi } from "@/lib/api-client"
import type { Transaction } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { formatPhoneNumberForDisplay } from "@/lib/utils"

export default function TransactionHistoryPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "deposit" | "withdrawal">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accept" | "reject" | "timeout">("all")

  useEffect(() => {
    fetchTransactions()
  }, [currentPage, searchTerm, typeFilter, statusFilter])

  useEffect(() => {
    const handleFocus = () => fetchTransactions()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      const params: any = { page: currentPage, page_size: 10 }
      if (searchTerm) params.search = searchTerm
      if (typeFilter !== "all") params.type_trans = typeFilter
      if (statusFilter !== "all") params.status = statusFilter
      
      const data = await transactionApi.getHistory(params)
      setTransactions(data.results)
      setTotalCount(data.count)
      setTotalPages(Math.ceil(data.count / 10))
    } catch (error) {
      toast.error("Erreur lors du chargement")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusConfig = (status: Transaction["status"]) => {
    const configs: Record<string, { icon: any; color: string; bg: string; label: string }> = {
      pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "En attente" },
      accept: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Accepté" },
      init_payment: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "En attente" },
      error: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Erreur" },
      reject: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Rejeté" },
      timeout: { icon: AlertCircle, color: "text-slate-500", bg: "bg-slate-500/10", label: "Expiré" },
    }
    return configs[status] || configs.timeout
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500">Veuillez vous connecter</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3FA9FF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Historique</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{totalCount} transactions</p>
          </div>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={isLoading}
          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-[#3FA9FF] hover:text-[#3FA9FF] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#3FA9FF] focus:ring-2 focus:ring-[#3FA9FF]/20 outline-none transition-all text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as any); setCurrentPage(1) }}
            className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#3FA9FF] focus:ring-2 focus:ring-[#3FA9FF]/20 outline-none text-sm"
          >
            <option value="all">Tous types</option>
            <option value="deposit">Dépôts</option>
            <option value="withdrawal">Retraits</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1) }}
            className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#3FA9FF] focus:ring-2 focus:ring-[#3FA9FF]/20 outline-none text-sm"
          >
            <option value="all">Tous statuts</option>
            <option value="pending">En attente</option>
            <option value="accept">Accepté</option>
            <option value="reject">Rejeté</option>
            <option value="timeout">Expiré</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#3FA9FF] animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <History className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-medium text-slate-600 dark:text-slate-300">Aucune transaction</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Vos transactions apparaîtront ici</p>
          </div>
        ) : (
          <div>
            {transactions.map((transaction, index) => {
              const statusConfig = getStatusConfig(transaction.status)
              const StatusIcon = statusConfig.icon
              const isDeposit = transaction.type_trans === "deposit"
              
              return (
                <div 
                  key={transaction.id}
                  className={`flex items-center gap-4 p-4 ${index !== transactions.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isDeposit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {isDeposit ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">#{transaction.reference}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {transaction.app_details?.name || transaction.app} • {formatPhoneNumberForDisplay(transaction.phone_number)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {format(new Date(transaction.created_at), "dd MMM yyyy, HH:mm", { locale: fr })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold ${isDeposit ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {isDeposit ? '+' : '−'}{transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400">FCFA</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500">Page {currentPage}/{totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-[#3FA9FF] hover:text-[#3FA9FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-[#3FA9FF] hover:text-[#3FA9FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
