import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'

export const Footer: React.FC = () => {
    const [email, setEmail] = useState('')

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault()
        // Handle newsletter subscription
        console.log('Subscribe:', email)
        setEmail('')
    }

    return (
        <footer className="footer-top-stripe bg-[color:var(--navy-900)] text-white/90">
            {/* Main Footer */}
            <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10 py-16 md:py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Producto */}
                    <div>
                        <h4 className="text-sm uppercase tracking-wide font-medium text-white/80 mb-4">
                            Producto
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/how-it-works" className="text-base text-white hover:text-[color:var(--lime-400)] transition-colors duration-200">
                                    Cómo funciona
                                </Link>
                            </li>
                            <li>
                                <Link to="/for-consumers" className="text-base text-white hover:text-[color:var(--lime-400)] transition-colors duration-200">
                                    Para Consumidores
                                </Link>
                            </li>
                            <li>
                                <Link to="/for-teams" className="text-base text-white hover:text-[color:var(--lime-400)] transition-colors duration-200">
                                    Para Equipos
                                </Link>
                            </li>
                            <li>
                                <Link to="/for-merchants" className="text-base text-white hover:text-[color:var(--lime-400)] transition-colors duration-200">
                                    Para Comercios
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Compañía */}
                    <div>
                        <h4 className="text-sm uppercase tracking-wide font-medium text-white/80 mb-4">
                            Compañía
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/about" className="text-base text-white hover:text-[color:var(--lime-400)] transition-colors duration-200">
                                    Sobre nosotros
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-base text-white hover:text-[color:var(--lime-400)] transition-colors duration-200">
                                    Contacto
                                </Link>
                            </li>
                            <li>
                                <Link to="/faq" className="text-base text-white hover:text-[color:var(--lime-400)] transition-colors duration-200">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-sm uppercase tracking-wide font-medium text-white/80 mb-4">
                            Legal
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/terms" className="text-base text-white hover:text-[color:var(--lime-400)] transition-colors duration-200">
                                    Términos de Servicio
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-base text-white hover:text-[color:var(--lime-400)] transition-colors duration-200">
                                    Política de Privacidad
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="text-sm uppercase tracking-wide font-medium text-white/80 mb-4">
                            Newsletter
                        </h4>
                        <p className="text-base text-white/80 mb-4">
                            Mantente actualizado
                        </p>
                        <form onSubmit={handleSubscribe} className="space-y-3">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className="w-full px-4 py-3 text-sm border border-slate-700 bg-[color:var(--navy-900)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--blue-600)] focus:border-transparent text-white"
                                required
                            />
                            <Button
                                type="submit"
                                className="w-full h-11 text-sm font-semibold bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-lg transition-colors duration-200"
                            >
                                Suscribirse
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
            {/* Bottom Bar */}
            <div className="border-t border-[rgba(255,255,255,0.06)]">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <Link to="/" className="text-xl font-bold text-white mb-4 md:mb-0">
                            DasCash
                        </Link>
                        <p className="text-sm text-white/70">
                            © 2026 GK Gestión Deportiva. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}
