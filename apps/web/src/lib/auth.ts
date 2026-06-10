export type AuthTokens = {
  access: string
  refresh?: string
}

const KEY = 'auth.tokens'

export function setTokens(tokens: AuthTokens) {
  localStorage.setItem(KEY, JSON.stringify(tokens))
}

export function getTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function getAccessToken(): string | null {
  return getTokens()?.access ?? null
}

export function clearTokens() {
  localStorage.removeItem(KEY)
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

const EMAIL_KEY = 'auth.email'
export function setUserEmail(email: string) {
  localStorage.setItem(EMAIL_KEY, email)
}
export function getUserEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY)
}
