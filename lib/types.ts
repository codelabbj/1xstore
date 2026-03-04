import type { TransactionType, TransactionStatus, SourceType } from './constants'

export interface User {
  id: string
  bonus_available: number
  balance: number
  is_superuser: boolean
  username: string
  first_name: string
  last_name: string
  email: string
  is_delete: boolean
  phone: string
  otp: string | null
  otp_created_at: string | null
  is_block: boolean
  referrer_code: string | null
  referral_code: string
  is_active: boolean
  is_staff: boolean
  is_supperuser: boolean
  date_joined: string
  last_login: string
  groups: string[]
  user_permissions: string[]
}

export interface AuthResponse {
  refresh: string
  access: string
  exp: string
  data: User
}

export interface Network {
  id: number
  created_at: string
  name: string
  placeholder: string
  public_name: string
  country_code: string
  indication: string
  image: string
  withdrawal_message: string | null
  deposit_api: string
  withdrawal_api: string
  payment_by_link: boolean
  otp_required: boolean
  enable: boolean
  deposit_message: string
  active_for_deposit: boolean
  active_for_with: boolean
}

export interface UserPhone {
  id: number
  created_at: string
  phone: string
  user: string | null
  telegram_user: number
  network: number
}

export interface Platform {
  id: string
  name: string
  image: string
  enable: boolean
  deposit_tuto_link: string | null
  withdrawal_tuto_link: string | null
  why_withdrawal_fail: string | null
  order: number | null
  city: string | null
  street: string | null
  minimun_deposit: number
  max_deposit: number
  minimun_with: number
  max_win: number
}

export interface UserAppId {
  id: number
  created_at: string
  user_app_id: string
  user: string | null
  telegram_user: number
  app: string
  app_name?: string
  app_details?: {
    id: string
    name: string
    image: string
    enable: boolean
    deposit_tuto_link: string | null
    withdrawal_tuto_link: string | null
    why_withdrawal_fail: string | null
    order: number | null
    city: string | null
    street: string | null
    minimun_deposit: number
    max_deposit: number
    minimun_with: number
    max_win: number
    active_for_deposit: boolean
    active_for_with: boolean
  }
}

export interface Transaction {
  id: number
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  amount: number
  deposit_reward_amount: number | null
  reference: string
  type_trans: TransactionType
  status: TransactionStatus
  created_at: string
  validated_at: string | null
  webhook_data: any
  wehook_receive_at: string | null
  phone_number: string
  user_app_id: string
  withdriwal_code: string | null
  error_message: string | null
  transaction_link: string | null
  net_payable_amout: number | null
  otp_code: string | null
  public_id: string | null
  already_process: boolean
  source: SourceType
  old_status: string
  old_public_id: string
  success_webhook_send: boolean
  fail_webhook_send: boolean
  pending_webhook_send: boolean
  timeout_webhook_send: boolean
  telegram_user: number | null
  app: string
  network: number
  message?: string
  ussd_code?: string
  app_details?: {
    id: string
    name: string
    image: string
    enable: boolean
    deposit_tuto_link: string | null
    withdrawal_tuto_link: string | null
    why_withdrawal_fail: string | null
    order: number | null
    city: string | null
    street: string | null
    minimun_deposit: number
    max_deposit: number
    minimun_with: number
    max_win: number
    active_for_deposit: boolean
    active_for_with: boolean
  }
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Notification {
  id: number
  reference: string | null
  created_at: string
  content: string
  is_read: boolean
  title: string
  user: string
}

export interface Bonus {
  id: number
  created_at: string
  amount: string
  reason_bonus: string
  transaction: number | null
  user: string
}

export interface SearchUserResponse {
  UserId: number
  Name: string
  CurrencyId: number
}

export interface Advertisement {
  id?: string | number
  image?: string
  image_url?: string
  url?: string
  link?: string
  title?: string
  description?: string
  enable?: boolean
  created_at?: string
  [key: string]: any // Allow for flexible response structure
}

export interface Settings {
  referral_bonus?: boolean
  [key: string]: any // Allow for flexible response structure
}

export interface Coupon {
  id: number
  created_at: string
  code: string
  bet_app: string
}
