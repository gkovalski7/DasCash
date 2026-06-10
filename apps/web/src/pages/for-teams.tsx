import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export default function ForTeamsPage() {
    return (
        <div className="bg-white">
            {/* Hero Section - fullscreen */}
            <section className="relative min-h-[calc(100vh-4rem)] flex items-center">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10 text-center w-full">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.05] tracking-tight mb-8">
                        Recaudación de fondos<br />
                        <span className="text-blue-600">sin esfuerzo</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
                        Transforma las compras diarias de tu comunidad en fondos para tu causa. Cada compra se convierte automáticamente en una donación para tu causa.
                    </p>
                    <Link to="/signup?role=team">
                        <Button className="h-12 px-8 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-3xl">
                            Registrar mi equipo
                        </Button>
                    </Link>
                </div>
            </section>

            {/* How it works for teams */}
            <section className="py-16 md:py-20 lg:py-24 bg-gray-50">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
                        Cómo funciona para equipos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
                            <div className="text-6xl mb-6">📝</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                1. Registra tu equipo
                            </h3>
                            <p className="text-gray-600">
                                Crea tu perfil de equipo y establece tus metas de recaudación de fondos.
                            </p>
                        </div>
                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
                            <div className="text-6xl mb-6">👥</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                2. Invita a tu comunidad
                            </h3>
                            <p className="text-gray-600">
                                Comparte tu código de equipo con padres, familiares y seguidores.
                            </p>
                        </div>
                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
                            <div className="text-6xl mb-6">💸</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                3. Recibe fondos automáticamente
                            </h3>
                            <p className="text-gray-600">
                                Cada compra de tu comunidad genera cashback directo para tu causa.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits for teams */}
            <section className="py-16 md:py-20 lg:py-24">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
                        Beneficios para tu equipo
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="space-y-8">
                                <div className="flex items-start">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mr-4 flex-shrink-0">
                                        📊
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            Recaudación pasiva
                                        </h3>
                                        <p className="text-gray-600">
                                            Sin rifas, sin ventas. Tu comunidad genera fondos simplemente comprando donde ya compra.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl mr-4 flex-shrink-0">
                                        🎯
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            Metas claras
                                        </h3>
                                        <p className="text-gray-600">
                                            Seguimiento en tiempo real de tu progreso hacia las metas del equipo.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl mr-4 flex-shrink-0">
                                        👨‍👩‍👧‍👦
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            Comunidad comprometida
                                        </h3>
                                        <p className="text-gray-600">
                                            Involucra a padres y familiares de manera fácil y sin presión.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-8xl mb-6">🏆</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                Miles de equipos ya confían en nosotros
                            </h3>
                            <p className="text-gray-600 text-lg">
                                Desde equipos escolares hasta clubes profesionales, todos recaudan más fondos con menos esfuerzo.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 md:py-20 lg:py-24 bg-blue-600">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Comienza a recaudar hoy mismo
                    </h2>
                    <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                        Únete a los equipos que han revolucionado su forma de recaudar fondos.
                    </p>
                    <Link to="/signup?role=team">
                        <Button className="h-12 px-8 text-lg font-semibold bg-white hover:bg-gray-100 text-blue-600 rounded-3xl">
                            Registrar equipo gratis
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    )
}