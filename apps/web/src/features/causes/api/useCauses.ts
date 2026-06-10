import { useEffect, useMemo, useState } from 'react'
import { fetchCauses, type ApiCause } from '../../../lib/api'

export type CausesQuery = {
  search?: string
  category?: string
  ordering?: string
  limit?: number
}

export function useCauses(params: CausesQuery) {
  const [data, setData] = useState<ApiCause[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const query = useMemo(() => {
    const q = new URLSearchParams()
    if (params.search) q.set('search', params.search)
    if (params.category) q.set('category', params.category)
    if (params.ordering) q.set('ordering', params.ordering)
    if (params.limit) q.set('limit', String(params.limit))
    return q
  }, [params.search, params.category, params.ordering, params.limit])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const json = await fetchCauses(query)
        if (!cancelled) setData(json)
      } catch (e: any) {
        if (!cancelled) {
          setError('No se pudieron cargar las causas. Intentá de nuevo más tarde.')
          setData([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [query])

  return { data, loading, error }
}
