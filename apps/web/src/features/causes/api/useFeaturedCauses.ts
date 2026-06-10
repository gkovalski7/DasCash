import { useEffect, useState } from 'react'
import { fetchFeaturedCauses, type ApiCause } from '../../../lib/api'

type State = { loading: boolean; error: string | null; data: ApiCause[] }

export function useFeaturedCauses(limit = 6) {
  const [state, setState] = useState<State>({ loading: true, error: null, data: [] })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setState(s => ({ ...s, loading: true, error: null }))
      try {
        const data = await fetchFeaturedCauses(limit)
        if (!cancelled) setState({ loading: false, error: null, data })
      } catch (e: any) {
        if (!cancelled) setState({ loading: false, error: e?.message || 'No se pudo cargar causas', data: [] })
      }
    }
    load()
    return () => { cancelled = true }
  }, [limit])

  return state
}
