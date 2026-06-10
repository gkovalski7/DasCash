import React, { useEffect, useMemo, useRef, useState } from 'react'

export type BrandCarouselProps = {
  /** How many numeric files to probe: /brands/1..count.png */
  count?: number
  /** Time it takes to desplazar una mitad completa (ms) */
  speedMs?: number
  className?: string
}

const PROMO_BY_INDEX: Record<number, string> = {
  1: '6% Cashback', // Under Armour
  2: 'Hasta 15%',   // Gator
  3: '4% Cashback', // Adidas
  4: '4% Cashback', // Icon Bldg
  5: '2% Cashback', // Best Buy
  6: '3% Cashback', // Example for the new logo
}

const BrandCard: React.FC<{ index: number; src: string }> = ({ index, src }) => {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  const name = `Marca ${index}`
  const promise = PROMO_BY_INDEX[index] ?? 'Hasta 10%'

  return (
    <div
      className="group relative bg-transparent rounded-2xl transition-all duration-200 min-h-[220px] md:min-h-[260px] lg:min-h-[280px] px-2 py-2 md:px-3 md:py-3 flex flex-col items-center justify-center gap-2"
      role="link"
      aria-label={`${name} — ${promise} para tu causa`}
      tabIndex={0}
    >
      {/* Filter group to include both logo and caption under same grayscale/opacity */}
  <div className="flex flex-col items-center justify-center w-full filter grayscale opacity-80 group-hover:grayscale-0 group-hover:filter-none transition-all duration-200">
        <img
          src={src}
          alt={name}
          className="h-32 md:h-48 lg:h-48 w-auto object-contain"
          loading="lazy"
          draggable={false}
          onError={() => setVisible(false)}
        />
        <div className="text-xs md:text-sm text-center mt-2 text-brand-gray-700">
          {promise}
        </div>
      </div>
    </div>
  )
}

export const BrandCarousel: React.FC<BrandCarouselProps> = ({ count = 24, speedMs = 26000, className = '' }) => {
  const files = useMemo(() => Array.from({ length: count }, (_, i) => i + 1), [count])
  const [images, setImages] = useState<Array<{ i: number; src: string }>>([])

  // Prefetch images and keep only those that exist
  useEffect(() => {
    let active = true
    const loadAll = async () => {
      const loaded: Array<{ i: number; src: string }> = []
      await Promise.all(
        files.map(
          (i) =>
            new Promise<void>((resolve) => {
              const src = `/brands/${i}.png`
              const img = new Image()
              img.onload = () => {
                if (active) loaded.push({ i, src })
                resolve()
              }
              img.onerror = () => resolve()
              img.src = src
            })
        )
      )
      if (active) setImages(loaded)
    }
    loadAll()
    return () => {
      active = false
    }
  }, [files])

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const firstTrackRef = useRef<HTMLDivElement | null>(null)
  const animRef = useRef<number | null>(null)
  const offsetRef = useRef(0)
  const widthRef = useRef(0)
  const lastTsRef = useRef<number | null>(null)

  useEffect(() => {
    const measure = () => {
      const el = firstTrackRef.current
      const w = el ? el.scrollWidth || el.offsetWidth || el.getBoundingClientRect().width : 0
      widthRef.current = w
      // clamp offset in case of resize
      if (w > 0 && offsetRef.current >= w) offsetRef.current = offsetRef.current % w
    }
    measure()
    const RO = (window as any).ResizeObserver
    const ro = RO && firstTrackRef.current ? new RO(() => measure()) : null
    if (ro && firstTrackRef.current) ro.observe(firstTrackRef.current)
    window.addEventListener('resize', measure)

    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts
      const dt = ts - (lastTsRef.current ?? ts)
      lastTsRef.current = ts
      const halfWidth = widthRef.current || 1
      const pxPerMs = halfWidth / speedMs
      offsetRef.current = offsetRef.current + dt * pxPerMs
      if (offsetRef.current >= halfWidth) offsetRef.current = offsetRef.current % halfWidth
      if (wrapperRef.current) {
        const track = wrapperRef.current.querySelector<HTMLDivElement>('[data-track]')
        if (track) track.style.transform = `translate3d(-${offsetRef.current}px,0,0)`
      }
      animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', measure)
    if (ro && firstTrackRef.current) ro.unobserve(firstTrackRef.current)
    }
  }, [speedMs, images.length])

  return (
    <div className={`relative w-full overflow-hidden select-none ${className}`} ref={wrapperRef}>
      {/* fading edges */}
  <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[color:var(--sky-50)] to-transparent" />
  <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[color:var(--sky-50)] to-transparent" />

      {/* Two consecutive tracks inside a single moving container */}
      <div className="overflow-hidden">
        <div className="flex items-stretch w-max will-change-transform" data-track>
          <div ref={firstTrackRef} className="flex items-stretch gap-5 md:gap-6 lg:gap-7">
            {images.map(({ i, src }, idx) => (
              <div key={`t1-${idx}-${i}`} className="shrink-0 min-w-[420px] sm:min-w-[480px] md:min-w-[560px]">
                <BrandCard index={i} src={src} />
              </div>
            ))}
          </div>
          <div className="flex items-stretch gap-5 md:gap-6 lg:gap-7">
            {images.map(({ i, src }, idx) => (
              <div key={`t2-${idx}-${i}`} className="shrink-0 min-w-[420px] sm:min-w-[480px] md:min-w-[560px]">
                <BrandCard index={i} src={src} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrandCarousel
