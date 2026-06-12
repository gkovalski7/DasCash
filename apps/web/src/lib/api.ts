import { env } from './env'
import { getAccessToken, getTokens, setTokens, clearTokens } from './auth'

// '' (string vacío) es válido: en producción la API se sirve same-origin detrás de nginx
const baseURL = env.apiUrl ?? 'http://localhost:8000'

function extractErrorMessage(data: any, fallback: string): string {
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.detail) return String(data.detail)
  if (data.message) return String(data.message)
  // Collapse DRF field errors: {field: ["msg1", "msg2"], non_field_errors: ["..."]}
  const parts: string[] = []
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) {
      parts.push(`${k}: ${v.join(', ')}`)
    } else if (v) {
      parts.push(`${k}: ${String(v)}`)
    }
  }
  return parts.join(' | ') || fallback
}

// ── JWT refresh queue ─────────────────────────────────────────────────
// Multiple concurrent requests that all hit 401 share a single refresh
// attempt. Subsequent callers wait in `refreshQueue` and receive the
// new token (or null) once the in-flight refresh settles.
let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

async function doRefresh(): Promise<string | null> {
  const tokens = getTokens()
  if (!tokens?.refresh) return null
  try {
    const res = await fetch(`${baseURL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    })
    if (!res.ok) { clearTokens(); return null }
    const data = await res.json()
    setTokens({ access: data.access, refresh: tokens.refresh })
    return data.access
  } catch {
    clearTokens()
    return null
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const makeCall = (accessToken: string | null) =>
    fetch(`${baseURL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {}),
      },
      ...options,
    })

  let res = await makeCall(getAccessToken())

  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    let newToken: string | null

    if (isRefreshing) {
      newToken = await new Promise<string | null>(resolve => { refreshQueue.push(resolve) })
    } else {
      isRefreshing = true
      newToken = await doRefresh()
      isRefreshing = false
      refreshQueue.forEach(cb => cb(newToken))
      refreshQueue = []
    }

    if (!newToken) {
      window.location.replace('/login')
      throw new Error('Sesión expirada. Redirigiendo...')
    }

    res = await makeCall(newToken)
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = extractErrorMessage(data, res.statusText)
    throw new Error(message || 'Request failed')
  }
  return data as T
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}

export function post<T>(path: string, body?: any): Promise<T> {
  return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
}

export function patch<T>(path: string, body?: any): Promise<T> {
  return request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined })
}

export function del<T = void>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' })
}

// ── Paginated response wrapper ────────────────────────────────────────
export type ApiPaginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ── Commerce ─────────────────────────────────────────────────────────
export type ApiCategory = { id: number; name: string; slug: string; participates_in_cashback: boolean }

export type ApiStoreSupportedCause = {
  id: number
  cause_id: number
  title: string
  slug: string
  category: string
  added_at: string
}

export type ApiStore = {
  id: number
  merchant: number
  display_name: string
  address?: string
  qrcode_slug: string
  description?: string
  logo_url?: string
  website_url?: string
  instagram_url?: string
  active: boolean
  categories: ApiCategory[]
  has_excluded_categories: boolean
  excluded_categories: string[]
  supported_causes: ApiStoreSupportedCause[]
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  return get<ApiCategory[]>(`/api/commerce/categories/`)
}

export async function fetchStores(params?: URLSearchParams): Promise<ApiPaginated<ApiStore>> {
  const qs = params && params.toString() ? `?${params.toString()}` : ''
  return get<ApiPaginated<ApiStore>>(`/api/commerce/stores/${qs}`)
}

export async function fetchStore(id: number): Promise<ApiStore> {
  return get<ApiStore>(`/api/commerce/stores/${id}/`)
}

export async function fetchStoreCauses(storeId: number): Promise<ApiStoreSupportedCause[]> {
  return get<ApiStoreSupportedCause[]>(`/api/commerce/stores/${storeId}/causes/`)
}

// ── Purchases ────────────────────────────────────────────────────────
export type ApiPurchase = {
  id: number
  user: number
  store: number
  store_name: string
  amount: string
  source: 'QR' | 'LINK' | 'RECEIPT'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  selected_cause: number | null
  cause_title: string | null
  created_at: string
}

export function createPurchase(data: {
  store: number
  amount: string
  source: string
  selected_cause?: number | null
}): Promise<ApiPurchase> {
  return post<ApiPurchase>('/api/cashback/purchases/', data)
}

export function fetchPurchases(page = 1, pageSize = 20): Promise<ApiPaginated<ApiPurchase>> {
  return get<ApiPaginated<ApiPurchase>>(`/api/cashback/purchases/?page=${page}&page_size=${pageSize}`)
}

export type ApiApproveResponse = {
  detail: string
  cashback_generated: boolean
  cashback_total?: string
  transactions_count?: number
  cause?: string | null
}

export function approvePurchase(id: number): Promise<ApiApproveResponse> {
  return post<ApiApproveResponse>(`/api/cashback/purchases/${id}/approve/`)
}

// ── Profile (real) ───────────────────────────────────────────────────
export type ApiProfile = {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  role: string
  preferred_cause: number | null
  preferred_cause_title: string | null
  total_donated: string
  causes_count: number
  purchases_count: number
}

export function getProfile(): Promise<ApiProfile> {
  return get<ApiProfile>('/api/profile/')
}

export function patchProfile(
  data: Partial<Pick<ApiProfile, 'username' | 'first_name' | 'last_name' | 'preferred_cause'>>
): Promise<ApiProfile> {
  return patch<ApiProfile>('/api/profile/', data)
}

// ── Donations (real) ─────────────────────────────────────────────────
export type ApiDonation = {
  id: number
  cause_title: string
  cause_slug: string | null
  amount: string
  percentage: string
  status: string
  store_name: string
  purchase_amount: string
  created_at: string
}

export function getProfileDonations(): Promise<ApiDonation[]> {
  return get<ApiDonation[]>('/api/profile/donations/')
}

// ── Causes (real) ────────────────────────────────────────────────────
export type ApiCause = {
  id: number
  title: string
  slug: string
  category: string
  summary: string
  image_url: string
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function fetchCauses(params?: URLSearchParams): Promise<ApiCause[]> {
  const qs = params && params.toString() ? `?${params.toString()}` : ''
  return get<ApiCause[]>(`/api/causes/${qs}`)
}

export function fetchCauseBySlug(slug: string): Promise<ApiCause> {
  return get<ApiCause>(`/api/causes/${slug}/`)
}

export async function fetchFeaturedCauses(limit = 6): Promise<ApiCause[]> {
  return get<ApiCause[]>(`/api/causes/?is_featured=true&limit=${limit}`)
}

// ── Admin ────────────────────────────────────────────────────────────
export type ApiUser = {
  id: number
  email: string
  username: string
  role: string
}

export type ApiMerchant = {
  id: number
  owner: number
  name: string
  cuit: string
  status: string
}

export type ApiCampaignStore = {
  id: number
  store: number
  store_name: string
  cashback_percentage: string | null
  effective_percentage: string
}

export type ApiCampaign = {
  id: number
  name: string
  cause: number
  cause_title: string
  percentage: string
  starts_at: string
  ends_at: string
  active: boolean
  campaign_stores: ApiCampaignStore[]
}

export function fetchUsers(role?: string): Promise<ApiUser[]> {
  const qs = role ? `?role=${role}` : ''
  return get<ApiUser[]>(`/api/admin/users/${qs}`)
}

export type ApiUserCreateResponse = ApiUser & {
  merchant?: { id: number; name: string; cuit: string }
}

export function createUser(data: {
  email: string
  password: string
  role: string
  merchant_name?: string
  merchant_cuit?: string
}): Promise<ApiUserCreateResponse> {
  return post<ApiUserCreateResponse>('/api/admin/users/', data)
}

export function fetchMerchants(): Promise<ApiMerchant[]> {
  return get<ApiMerchant[]>('/api/commerce/merchants/')
}

export function createMerchant(data: { name: string; cuit: string; owner: number }): Promise<ApiMerchant> {
  return post<ApiMerchant>('/api/commerce/merchants/', data)
}

export function updateMerchant(id: number, data: Partial<{ name: string; cuit: string; status: string }>): Promise<ApiMerchant> {
  return patch<ApiMerchant>(`/api/commerce/merchants/${id}/`, data)
}

export function deleteMerchant(id: number): Promise<void> {
  return del(`/api/commerce/merchants/${id}/`)
}

export function createStore(data: {
  merchant: number
  display_name: string
  address?: string
  qrcode_slug: string
  description?: string
  logo_url?: string
  website_url?: string
  instagram_url?: string
}): Promise<ApiStore> {
  return post<ApiStore>('/api/commerce/stores/', data)
}

export function updateStore(id: number, data: Partial<{
  display_name: string
  address: string
  qrcode_slug: string
  description: string
  logo_url: string
  active: boolean
}>): Promise<ApiStore> {
  return patch<ApiStore>(`/api/commerce/stores/${id}/`, data)
}

export function deleteStore(id: number): Promise<void> {
  return del(`/api/commerce/stores/${id}/`)
}

export function addStoreCause(storeId: number, causeId: number): Promise<ApiStoreSupportedCause> {
  return post<ApiStoreSupportedCause>(`/api/commerce/stores/${storeId}/causes/`, { cause: causeId })
}

export function removeStoreCause(storeId: number, causeId: number): Promise<void> {
  return del(`/api/commerce/stores/${storeId}/causes/${causeId}/`)
}

export function fetchCampaigns(): Promise<ApiCampaign[]> {
  return get<ApiCampaign[]>('/api/cashback/campaigns/')
}

export function fetchCampaign(id: number): Promise<ApiCampaign> {
  return get<ApiCampaign>(`/api/cashback/campaigns/${id}/`)
}

export function createCampaign(data: {
  name: string
  cause: number
  store_ids: number[]
  percentage: string
  starts_at: string
  ends_at: string
  active: boolean
}): Promise<ApiCampaign> {
  return post<ApiCampaign>('/api/cashback/campaigns/', data)
}

export function updateCampaign(id: number, data: {
  name: string
  cause: number
  store_ids: number[]
  percentage: string
  starts_at: string
  ends_at: string
  active: boolean
}): Promise<ApiCampaign> {
  return patch<ApiCampaign>(`/api/cashback/campaigns/${id}/`, data)
}

export function deleteCampaign(id: number): Promise<void> {
  return del(`/api/cashback/campaigns/${id}/`)
}

// ── Password reset ───────────────────────────────────────────────────
export function requestPasswordReset(email: string): Promise<{ detail: string }> {
  return post<{ detail: string }>('/api/auth/password-reset/', { email })
}

export function confirmPasswordReset(data: {
  uid: string
  token: string
  new_password: string
  confirm_password: string
}): Promise<{ detail: string }> {
  return post<{ detail: string }>('/api/auth/password-reset/confirm/', data)
}

// ── Causes CRUD (admin) ─────────────────────────────────────────────
export function createCause(data: {
  title: string
  category: string
  summary?: string
  image_url?: string
  is_active?: boolean
  is_featured?: boolean
}): Promise<ApiCause> {
  return post<ApiCause>('/api/causes/', data)
}

export function updateCause(slug: string, data: Partial<{
  title: string
  category: string
  summary: string
  image_url: string
  is_active: boolean
  is_featured: boolean
}>): Promise<ApiCause> {
  return patch<ApiCause>(`/api/causes/${slug}/`, data)
}

export function deleteCause(slug: string): Promise<void> {
  return del(`/api/causes/${slug}/`)
}

