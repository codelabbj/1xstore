import api from "./api"
import { formatPhoneNumber } from "./utils"
import type {
  AuthResponse,
  Network,
  UserPhone,
  Platform,
  UserAppId,
  Transaction,
  PaginatedResponse,
  Notification,
  Bonus,
  SearchUserResponse,
  Advertisement,
  Settings,
  Coupon,
  User,
} from "./types"

export const authApi = {
  login: async (email_or_phone: string, password: string) => {
    // Format phone number if it looks like a phone (contains digits and possibly +)
    const formattedInput = /^[\d\s+()-]+$/.test(email_or_phone)
      ? formatPhoneNumber(email_or_phone)
      : email_or_phone

    const { data } = await api.post<AuthResponse>("/auth/login", {
      email_or_phone: formattedInput,
      password,
    })
    return data
  },

  register: async (userData: {
    first_name: string
    last_name: string
    email: string
    phone: string
    password: string
    re_password: string
    referral_code?: string
  }) => {
    const payload: any = {
      ...userData,
      phone: formatPhoneNumber(userData.phone),
    }
    // Only include referral_code if it's provided
    if (userData.referral_code) {
      payload.referral_code = userData.referral_code
    }
    const { data } = await api.post("/auth/registration", payload)
    return data
  },

  refreshToken: async (refresh: string) => {
    const { data } = await api.post("/auth/token/refresh/", { refresh })
    return data
  },

  getProfile: async () => {
    const { data } = await api.get<User>("/auth/me")
    return data
  },

  updateProfile: async (profileData: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }) => {
    const { data } = await api.post<User>("/auth/edit", {
      ...profileData,
      phone: formatPhoneNumber(profileData.phone),
    })
    return data
  },

  changePassword: async (passwordData: {
    old_password: string
    new_password: string
    confirm_new_password: string
  }) => {
    const { data } = await api.post("/auth/change_password", {
      old_password: passwordData.old_password,
      new_password: passwordData.new_password,
      confirm_new_password: passwordData.confirm_new_password,
    })
    return data
  },

  sendOtp: async (email: string) => {
    const { data } = await api.post("/auth/send_otp", {
      email,
    })
    return data
  },

  resetPassword: async (resetData: {
    otp: string
    new_password: string
    confirm_new_password: string
  }) => {
    const { data } = await api.post("/auth/reset_password", {
      otp: resetData.otp,
      new_password: resetData.new_password,
      confirm_new_password: resetData.confirm_new_password,
    })
    return data
  },
}

export const networkApi = {
  getAll: async (type?: "deposit" | "withdrawal") => {
    const url = type ? `/mobcash/network?type=${type}` : "/mobcash/network"
    const { data } = await api.get<Network[]>(url)
    return data
  },
}

export const phoneApi = {
  getAll: async (network?: number) => {
    const url = network
      ? `/mobcash/user-phone/?network=${network}`
      : "/mobcash/user-phone/"
    const { data } = await api.get<UserPhone[]>(url)
    return data
  },

  create: async (phone: string, network: number) => {
    const { data } = await api.post<UserPhone>("/mobcash/user-phone/", {
      phone: formatPhoneNumber(phone),
      network,
    })
    return data
  },

  update: async (id: number, phone: string, network: number) => {
    const { data } = await api.patch<UserPhone>(`/mobcash/user-phone/${id}/`, {
      phone: formatPhoneNumber(phone),
      network,
    })
    return data
  },

  delete: async (id: number) => {
    await api.delete(`/mobcash/user-phone/${id}/`)
  },
}

export const platformApi = {
  getAll: async (type?: "deposit" | "withdrawal") => {
    const url = type ? `/mobcash/plateform?type=${type}` : "/mobcash/plateform"
    const { data } = await api.get<Platform[]>(url)
    return data
  },
}

export const userAppIdApi = {
  getAll: async () => {
    const { data } = await api.get<UserAppId[]>("/mobcash/user-app-id")
    return data
  },

  getByPlatform: async (bet_app: string) => {
    const { data } = await api.get<UserAppId[]>(`/mobcash/user-app-id?app_name=${bet_app}`)
    return data
  },

  create: async (user_app_id: string, app: string) => {
    const { data } = await api.post<UserAppId>("/mobcash/user-app-id/", {
      user_app_id,
      app_name: app,
    })
    return data
  },

  update: async (id: number, user_app_id: string, app: string) => {
    const { data } = await api.patch<UserAppId>(`/mobcash/user-app-id/${id}/`, {
      user_app_id,
      app_name: app,
    })
    return data
  },

  delete: async (id: number) => {
    await api.delete(`/mobcash/user-app-id/${id}/`)
  },

  searchUser: async (appId: string, betId: string) => {
    const { data } = await api.post<SearchUserResponse>("/mobcash/search-user", {
      app_id: appId,
      userid: betId,
    })
    return data
  },
}

export const transactionApi = {
  getHistory: async (params?: {
    page?: number
    page_size?: number
    user?: string
    type_trans?: "deposit" | "withdrawal"
    status?: "pending" | "accept" | "reject" | "timeout"
    source?: string
    network?: number
    search?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value))
        }
      })
    }
    const { data } = await api.get<PaginatedResponse<Transaction>>(
      `/mobcash/transaction-history?${queryParams.toString()}`,
    )
    return data
  },

  createDeposit: async (depositData: {
    amount: number
    phone_number: string
    app: string
    user_app_id: string
    network: number
    source: string
  }) => {
    const { data } = await api.post<Transaction>("/mobcash/transaction-deposit", {
      ...depositData,
      phone_number: formatPhoneNumber(depositData.phone_number),
    })
    return data
  },

  createWithdrawal: async (withdrawalData: {
    amount: number
    phone_number: string
    app: string
    user_app_id: string
    network: number
    withdriwal_code: string
    source: string
  }) => {
    const { data } = await api.post<Transaction>("/mobcash/transaction-withdrawal", {
      ...withdrawalData,
      phone_number: formatPhoneNumber(withdrawalData.phone_number),
    })
    return data
  },
}

export const notificationApi = {
  getAll: async (page = 1) => {
    const { data } = await api.get<PaginatedResponse<Notification>>(`/mobcash/notification?page=${page}`)
    return data
  },
}

export const bonusApi = {
  getAll: async (page = 1) => {
    const { data } = await api.get<PaginatedResponse<Bonus>>(`/mobcash/bonus?page=${page}`)
    return data
  },
}

export const advertisementApi = {
  get: async () => {
    const { data } = await api.get<PaginatedResponse<Advertisement>>("/mobcash/ann")
    return data
  },
}

export const settingsApi = {
  get: async () => {
    const { data } = await api.get<Settings>("/mobcash/setting")
    return data
  },
}

export const couponApi = {
  getAll: async (page = 1) => {
    const { data } = await api.get<PaginatedResponse<Coupon>>(`/mobcash/coupon?page=${page}`)
    return data
  },
}
