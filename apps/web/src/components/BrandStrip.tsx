import React from 'react'

export type Brand = {
  name: string
  src: string
  promise: string
}

type BrandStripProps = {
  brands: Brand[]
  className?: string
}

const BrandCard: React.FC<{ brand: Brand }> = ({ brand }) => {
  return (
    <div
      className="group relative bg-transparent rounded-2xl transition-all duration-200 min-h-[150px] md:min-h-[170px] lg:min-h-[184px] px-2 py-2 md:px-3 md:py-3 flex flex-col items-center justify-center gap-3"
      role="link"
      aria-label={`${brand.name} — ${brand.promise} para tu causa`}
      tabIndex={0}
    >
      <div className="flex items-center justify-center w-full">
        {/* Logo area with fixed visual heights per breakpoint */}
        <img
          src={brand.src}
          alt={brand.name}
          className="max-h-14 md:max-h-20 lg:max-h-24 w-auto object-contain filter grayscale opacity-80 group-hover:filter-none group-hover:grayscale-0 transition-all duration-200"
          loading="lazy"
          draggable={false}
        />
      </div>
      <div className="text-xs md:text-sm text-blue-700/90 text-center mt-2">
        {brand.promise}
      </div>
    </div>
  )
}

export const BrandStrip: React.FC<BrandStripProps> = ({ brands, className = '' }) => {
  if (!brands || brands.length === 0) return null

  return (
    <div className={className}>
      {/* Mobile: horizontal scroll with snap */}
      <div className="md:hidden relative">
        {/* fades */}
  <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[color:var(--sky-50)] to-transparent" />
  <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[color:var(--sky-50)] to-transparent" />

        <div className="-mx-6 px-6 overflow-x-auto snap-x snap-mandatory flex gap-4">
          {brands.map((b, i) => (
            <div key={i} className="snap-center shrink-0 w-[78%] xsm:w-[66%] sm:w-[56%]">
              <BrandCard brand={b} />
            </div>
          ))}
        </div>
      </div>

      {/* Tablet/Desktop: responsive grid */}
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
        {brands.map((b, i) => (
          <BrandCard key={i} brand={b} />
        ))}
      </div>
    </div>
  )
}

export default BrandStrip
