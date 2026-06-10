import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export default function ForConsumersPage() {
    return (
        <div className="bg-white">
            {/* Hero Section - fullscreen */}
            <section className="relative min-h-[calc(100vh-4rem)] flex items-center">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10 text-center w-full">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.05] tracking-tight mb-8">
                        Compran como siempre,<br />
                        <span className="text-blue-600">apoyan las causas que eligen</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
                        Elijan una causa, compren en sus marcas favoritas y el % de cashback de cada compra
                        se dirige automáticamente a esa causa. Sin cupones, sin pasos extra, sin complicaciones.
                    </p>
                    <Link to="/signup">
                        <Button className="h-12 px-8 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-3xl">
                            Crear cuenta y elegir causa
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-16 md:py-20 lg:py-24 bg-gray-50">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
                        Beneficios para ustedes
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
                            <div className="text-5xl mb-6">🎯</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                Ustedes eligen la causa
                            </h3>
                            <p className="text-gray-600">
                                Seleccionen qué causa, club o proyecto apoyar. Pueden cambiarla cuando lo necesiten.
                            </p>
                        </div>
                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
                            <div className="text-5xl mb-6">💙</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                Cashback que financia impacto
                            </h3>
                            <p className="text-gray-600">
                                El reembolso de sus compras diarias va directo a la causa elegida. Ustedes no pagan de más.
                            </p>
                        </div>
                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
                            <div className="text-5xl mb-6">📊</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                Transparencia y control
                            </h3>
                            <p className="text-gray-600">
                                Vean cuánto aportaron, en qué comercios compraron y el progreso de su causa en tiempo real.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 md:py-20 lg:py-24">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                        ¿Listos para empezar a generar impacto?
                    </h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        Súmense y destinen el cashback de sus compras a las causas que más les importan.
                    </p>
                    <Link to="/signup">
                        <Button className="h-12 px-8 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-3xl">
                            Crear cuenta y elegir causa
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    )
}
