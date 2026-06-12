import React from 'react'
import { Link } from 'react-router-dom'
import { Store as StoreIcon, Heart } from 'lucide-react'
import type { ApiCategory, ApiStore, ApiStoreSupportedCause } from '../lib/api'

// Aliases de los tipos de la capa de API: una sola fuente de verdad (lib/api.ts)
export type Category = ApiCategory
export type StoreSupportedCause = ApiStoreSupportedCause
export type StoreItem = ApiStore

const StoreCard: React.FC<{ store: StoreItem }> = ({ store }) => {
  const causes = store.supported_causes ?? []

  return (
    <Link
      to={`/app/stores/${store.id}`}
      className="block bg-white rounded-2xl overflow-hidden shadow-[0_1px_6px_rgba(10,34,54,0.08)]
                 hover:shadow-md transition-shadow"
    >
      <div className="h-20 bg-gradient-to-br from-brand-navy-900 to-brand-green-600 flex items-center justify-center">
        {store.logo_url
          ? <img src={store.logo_url} alt={store.display_name} className="h-12 w-12 rounded-xl object-cover" />
          : <StoreIconFallback />}
      </div>
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-app font-extrabold text-brand-navy-900 truncate">{store.display_name}</h3>
          <p className="text-xs text-gray-400 truncate">
            {[store.categories.map((c) => c.name).join(' · '), store.address].filter(Boolean).join(' — ')}
          </p>
        </div>
        {causes.length > 0 && (
          <span className="flex-shrink-0 inline-flex items-center gap-1 bg-brand-green-50 text-brand-green-700
                           text-xs font-bold px-2.5 py-1 rounded-lg">
            <Heart size={11} className="fill-current" /> {causes.length} causa{causes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </Link>
  )
}

function StoreIconFallback() {
  return (
    <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center">
      <StoreIcon size={22} className="text-white" />
    </div>
  )
}

export default StoreCard
