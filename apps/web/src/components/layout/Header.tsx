import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../ui/Button'

export const Header: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false)
    const [open, setOpen] = useState(false)
    const location = useLocation()

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 24)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const isTransparent = location.pathname === '/' && !isScrolled

    return (
        <header
            className={
                'sticky top-0 z-50 w-full transition-all duration-300 ' +
                (isTransparent
                    ? 'bg-transparent border-b border-white/10 backdrop-blur-sm'
                    : 'bg-white border-b border-gray-100 shadow-sm')
            }
        >
            <div className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center">

                {/* Logo */}
                <Link
                    to="/"
                    className={`mr-8 flex items-center gap-2 font-display font-bold text-lg tracking-tight
                        ${isTransparent ? 'text-white' : 'text-brand-navy-900'}`}
                >
                    <span className="w-7 h-7 rounded-lg bg-brand-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-extrabold">D</span>
                    </span>
                    DasCash
                </Link>

                {/* Nav desktop */}
                <nav className={`ml-auto hidden md:flex items-center gap-8 text-sm font-body
                    ${isTransparent ? 'text-white/85' : 'text-brand-navy-900/70'}`}>
                    <NavLink to="/causas"        current={location.pathname} transparent={isTransparent}>Causas</NavLink>
                    <NavLink to="/how-it-works"  current={location.pathname} transparent={isTransparent}>Cómo funciona</NavLink>
                    <NavLink to="/for-consumers" current={location.pathname} transparent={isTransparent}>Marcas</NavLink>
                    <NavLink to="/for-business"  current={location.pathname} transparent={isTransparent}>Para comercios</NavLink>
                </nav>

                {/* CTA desktop */}
                <div className="ml-8 hidden md:flex items-center gap-3">
                    <Link
                        to="/login"
                        className={`text-sm font-semibold font-body transition-colors
                            ${isTransparent
                                ? 'text-white/80 hover:text-white'
                                : 'text-brand-navy-900/65 hover:text-brand-navy-900'}`}
                    >
                        Ingresar
                    </Link>
                    <Link to="/signup">
                        <Button
                            size="sm"
                            variant={isTransparent ? 'lime' : 'primary'}
                            className="rounded-full"
                        >
                            Crear cuenta
                        </Button>
                    </Link>
                </div>

                {/* Hamburger mobile */}
                <button
                    onClick={() => setOpen(true)}
                    className={`md:hidden ml-auto p-2 rounded-lg transition-colors
                        ${isTransparent
                            ? 'text-white/80 hover:text-white'
                            : 'text-brand-navy-900/65 hover:text-brand-navy-900'}`}
                    aria-label="Abrir menú"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Mobile drawer */}
            {open && (
                <div className="md:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-0 h-full w-80 max-w-[85%] bg-brand-navy-900 shadow-2xl flex flex-col">

                        {/* Drawer header */}
                        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
                            <Link to="/" onClick={() => setOpen(false)}
                                className="flex items-center gap-2 font-display font-bold text-white">
                                <span className="w-7 h-7 rounded-lg bg-brand-blue-600 flex items-center justify-center">
                                    <span className="text-white text-xs font-extrabold">D</span>
                                </span>
                                DasCash
                            </Link>
                            <button onClick={() => setOpen(false)}
                                className="p-2 text-white/60 hover:text-white transition-colors"
                                aria-label="Cerrar menú">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Drawer links */}
                        <nav className="flex flex-col p-4 gap-1 flex-1">
                            {[
                                { to: '/causas',        label: 'Causas' },
                                { to: '/how-it-works',  label: 'Cómo funciona' },
                                { to: '/for-consumers', label: 'Marcas' },
                                { to: '/for-business',  label: 'Para comercios' },
                            ].map(({ to, label }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-3 rounded-xl text-white/75 hover:text-white hover:bg-white/10 font-body text-base transition-colors"
                                >
                                    {label}
                                </Link>
                            ))}
                        </nav>

                        {/* Drawer footer CTAs */}
                        <div className="p-5 border-t border-white/10 flex flex-col gap-3">
                            <Link to="/login" onClick={() => setOpen(false)}>
                                <Button variant="secondary" size="lg" className="w-full rounded-xl">
                                    Ingresar
                                </Button>
                            </Link>
                            <Link to="/signup" onClick={() => setOpen(false)}>
                                <Button variant="lime" size="lg" className="w-full rounded-xl">
                                    Crear cuenta gratis
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}

const NavLink: React.FC<{
    to: string
    current: string
    transparent?: boolean
    children: React.ReactNode
}> = ({ to, current, transparent, children }) => {
    const isActive = current === to || current.startsWith(to + '/')
    const base = 'pb-0.5 border-b-2 transition-colors duration-200 font-body'
    const t = transparent
        ? {
            link:   'text-white/80 hover:text-white border-transparent hover:border-white/40',
            active: 'text-white font-semibold border-white',
          }
        : {
            link:   'text-brand-navy-900/65 hover:text-brand-navy-900 border-transparent',
            active: 'text-brand-navy-900 font-semibold border-brand-blue-600',
          }
    return (
        <Link to={to} className={`${base} ${isActive ? t.active : t.link}`}>
            {children}
        </Link>
    )
}
