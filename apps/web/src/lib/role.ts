import { getAccessToken } from './auth'

export type Role = 'CONSUMER' | 'MERCHANT' | 'ADMIN'

export function getRole(): Role | null {
  try {
    const token = getAccessToken()
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    const role = payload?.role
    if (role === 'CONSUMER' || role === 'MERCHANT' || role === 'ADMIN') return role
    return null
  } catch {
    return null
  }
}
