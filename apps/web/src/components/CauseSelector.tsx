import React from 'react'
import type { ApiStoreSupportedCause } from '../lib/api'

type Props = {
    causes: ApiStoreSupportedCause[]
    value: number | null
    onChange: (causeId: number | null) => void
    disabled?: boolean
}

/**
 * Cause selector for the purchase flow.
 * - 0 causes: renders nothing (no selection needed)
 * - 1 cause: auto-selects and shows info badge (calls onChange on mount)
 * - 2+ causes: renders a <select> dropdown
 */
const CauseSelector: React.FC<Props> = ({ causes, value, onChange, disabled }) => {
    // Auto-select when there's exactly one cause
    React.useEffect(() => {
        if (causes.length === 1 && value !== causes[0].cause_id) {
            onChange(causes[0].cause_id)
        }
    }, [causes, value, onChange])

    if (causes.length === 0) {
        return (
            <p className="text-sm text-gray-400 italic">Esta tienda no tiene causas asignadas.</p>
        )
    }

    if (causes.length === 1) {
        return (
            <div className="flex items-center gap-2">
                <span className="inline-block rounded-full bg-green-50 border border-green-200 text-green-800 px-2.5 py-1 text-sm font-medium">
                    {causes[0].title}
                </span>
                <span className="text-xs text-gray-500">(asignada automáticamente)</span>
            </div>
        )
    }

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Elegí una causa</label>
            <select
                value={value ?? ''}
                onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={disabled}
                required
            >
                <option value="">Seleccionar causa...</option>
                {causes.map(c => (
                    <option key={c.cause_id} value={c.cause_id}>
                        {c.title} ({c.category})
                    </option>
                ))}
            </select>
        </div>
    )
}

export default CauseSelector
