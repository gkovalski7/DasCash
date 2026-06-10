import React, { useMemo } from 'react'

export type BrandsCarouselProps = {
  images: string[]
  speedMs?: number // total time to complete one full loop
  className?: string
}

/**
 * Simple, dependency-free horizontal marquee for brand logos.
 * - Duplicates the images array to create a seamless infinite loop
   * - Uses CSS keyframes defined in globals.css (scroll-x)
 */
export const BrandsCarousel: React.FC<BrandsCarouselProps> = ({ images, speedMs = 20000, className = '' }) => {
  const trackStyle: React.CSSProperties = useMemo(
    () => ({
      animationDuration: `${speedMs}ms`,
    }),
    [speedMs]
  )

  // Ensure we have at least one image
  const safeImages = images && images.length > 0 ? images : []
  const loopImages = useMemo(() => [...safeImages, ...safeImages], [safeImages])

  return (
    <div className={`relative w-full overflow-hidden select-none ${className}`}>
      <div className="flex gap-12 items-center whitespace-nowrap will-change-transform animate-scroll-x" style={trackStyle}>
        {loopImages.map((src, i) => (
          <div key={i} className="flex items-center justify-center h-16 md:h-20 lg:h-24">
            <img
              src={src}
              alt={`Marca ${getFileName(src)}`}
              className="h-full w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-200"
              loading="lazy"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function getFileName(path: string) {
  try {
    const parts = path.split('/')
    return parts[parts.length - 1]?.split('.')?.[0] ?? 'logo'
  } catch {
    return 'logo'
  }
}

export default BrandsCarousel
