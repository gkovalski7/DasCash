import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import CategoryNotice from './CategoryNotice'
import type { ApiCategory, ApiStore, ApiStoreSupportedCause } from '../lib/api'

// Aliases de los tipos de la capa de API: una sola fuente de verdad (lib/api.ts)
export type Category = ApiCategory
export type StoreSupportedCause = ApiStoreSupportedCause
export type StoreItem = ApiStore

const StoreCard: React.FC<{ store: StoreItem }> = ({ store }) => {
  const causes = store.supported_causes ?? []
  const navigate = useNavigate()

  return (
    <Card className="flex flex-col p-0 overflow-hidden">
      {/* Cover */}
      <div className="relative h-32 w-full bg-gray-100">
        {store.logo_url ? (
          <img src={store.logo_url} alt={`Logo de ${store.display_name}`} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">Sin imagen</div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900">{store.display_name}</h3>
        </div>
        {store.description && (
          <p className="mt-2 text-sm text-gray-700 line-clamp-2" style={{ display: '-webkit-box', WebkitLineClamp: 2 as any, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
            {store.description}
          </p>
        )}
        {/* Categories */}
        <div className="mt-2 text-xs text-gray-700">
          {store.categories.map(c => (
            <span key={c.id} className={`mr-2 mb-1 inline-block rounded-full px-2 py-0.5 border ${c.participates_in_cashback ? 'border-gray-200 text-gray-700' : 'border-amber-300 text-amber-800'}`}>
              {c.name}{!c.participates_in_cashback ? ' • sin cashback' : ''}
            </span>
          ))}
        </div>

        {/* Supported causes */}
        {causes.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Causas que apoya</p>
            <div className="flex flex-wrap gap-1">
              {causes.map(c => (
                <span key={c.cause_id} className="inline-block rounded-full bg-green-50 border border-green-200 text-green-800 px-2 py-0.5 text-xs">
                  {c.title}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-xs text-gray-400 italic">Sin causas asignadas</p>
          </div>
        )}

        {/* Local notice */}
        {store.has_excluded_categories && store.excluded_categories && store.excluded_categories.length > 0 && (
          <div className="mt-3">
            <CategoryNotice categories={store.excluded_categories} />
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button className="h-9 px-3 text-sm" onClick={() => navigate(`/app/stores/${store.id}`)}>
            Registrar compra
          </Button>
          {store.website_url && (
            <a href={store.website_url} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" className="h-9 px-3 text-sm">Sitio</Button>
            </a>
          )}
          {store.instagram_url && (
            <a href={store.instagram_url} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" className="h-9 px-3 text-sm">Instagram</Button>
            </a>
          )}
        </div>
      </div>
    </Card>
  )
}

export default StoreCard
