import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Scrolls to top on route change
export default function ScrollToTop({ behavior = 'smooth' as ScrollBehavior }) {
    const location = useLocation()
    useEffect(() => {
        // In some browsers, behavior: 'instant' is not supported; 'auto' is the fallback
        const supportsSmooth = 'scrollBehavior' in document.documentElement.style
        const b: ScrollBehavior = supportsSmooth ? behavior : 'auto'
        window.scrollTo({ top: 0, left: 0, behavior: b })
    }, [location.pathname])
    return null
}
