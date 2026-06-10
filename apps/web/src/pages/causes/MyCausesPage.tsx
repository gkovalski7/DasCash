import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    getProfileDonations,
    type ApiDonation,
} from '../../lib/api'
import { Card } from '../../components/ui/Card'

type CauseImpact = {
    title: string
    slug: string | null
    total: number
    count: number
}

export default function MyCausesPage() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [donations, setDonations] = useState<ApiDonation[]>([])

    useEffect(() => {
        let cancelled = false
        async function load() {
            setLoading(true)
            setError(null)
            try {
                const data = await getProfileDonations()
                if (!cancelled) setDonations(data)
            } catch (e: any) {
                if (!cancelled) setError(e?.message || 'Error al cargar datos')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [])

    const impacts = useMemo(() => {
        const map = new Map<string, CauseImpact>()
        donations.forEach(d => {
            const key = d.cause_title
            const existing = map.get(key)
            if (existing) {
                existing.total += parseFloat(d.amount)
                existing.count += 1
            } else {
                map.set(key, {
                    title: d.cause_title,
                    slug: d.cause_slug,
                    total: parseFloat(d.amount),
                    count: 1,
                })
            }
        })
        return Array.from(map.values()).sort((a, b) => b.total - a.total)
    }, [donations])

    const grandTotal = useMemo(
        () => impacts.reduce((s, c) => s + c.total, 0),
        [impacts],
    )

    return (
        <div className="min-h-screen bg-white pt-6 pb-12">
            <div className="mx-auto max-w-screen-xl px-6 md:px-8 lg:px-10">
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mi Impacto</h1>
                    <p className="text-gray-600 mt-1">Causas que apoyaste con tus compras.</p>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">{error}</div>
                )}

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-6 w-1/3 rounded bg-gray-200" />
                        <div className="h-24 rounded-lg bg-gray-100" />
                        <div className="h-24 rounded-lg bg-gray-100" />
                    </div>
                ) : impacts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">Todavía no apoyaste ninguna causa.</p>
                        <p className="text-sm mt-1">Cuando hagas compras y se aprueben, tu impacto aparecerá aquí.</p>
                        <Link
                            to="/app/stores"
                            className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Explorar tiendas →
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Summary */}
                        <Card className="mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-gray-600">Total donado</span>
                                    <p className="text-2xl font-bold text-gray-900">${grandTotal.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-medium text-gray-600">Causas apoyadas</span>
                                    <p className="text-2xl font-bold text-gray-900">{impacts.length}</p>
                                </div>
                            </div>
                        </Card>

                        {/* Cause list */}
                        <div className="space-y-3">
                            {impacts.map(c => (
                                <Card key={c.title} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">
                                            {c.slug ? (
                                                <Link to={`/app/causes/${c.slug}`} className="hover:text-blue-600 hover:underline">
                                                    {c.title}
                                                </Link>
                                            ) : (
                                                c.title
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-500">{c.count} compra{c.count !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-semibold text-green-700">${c.total.toFixed(2)}</p>
                                        {grandTotal > 0 && (
                                            <p className="text-xs text-gray-400">
                                                {((c.total / grandTotal) * 100).toFixed(0)}% del total
                                            </p>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
