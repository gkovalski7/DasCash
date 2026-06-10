import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export default function HowItWorksPage() {
    return (
        <div className="bg-white">
            {/* Hero Section - fullscreen */}
            <section className="relative min-h-[calc(100vh-4rem)] flex items-center">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10 text-center w-full">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.05] tracking-tight mb-8">
                        Cashback que<br />
                        <span className="text-blue-600">genera impacto</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                        Descubre cómo transformamos las compras cotidianas en fondos para las causas que más importan.
                    </p>
                </div>
            </section>

            {/* Main Process */}
            <section className="py-16 md:py-20 lg:py-24 bg-gray-50">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
                        El proceso completo
                    </h2>
                    <div className="space-y-16">
                        {/* Step 1 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl mb-6">
                                    💳
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                                    1. Conecta tu tarjeta
                                </h3>
                                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                                    Vincula de forma segura tu tarjeta de débito o crédito a nuestra plataforma. Usamos tecnología bancaria de nivel empresarial para proteger tu información.
                                </p>
                                <ul className="space-y-3 text-gray-600">
                                    <li className="flex items-center">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                                        Encriptación de extremo a extremo
                                    </li>
                                    <li className="flex items-center">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                                        Certificación PCI DSS
                                    </li>
                                    <li className="flex items-center">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                                        No almacenamos datos sensibles
                                    </li>
                                </ul>
                            </div>
                            <div className="text-center">
                                <div className="text-9xl mb-4">🔒</div>
                                <p className="text-lg text-gray-500">Máxima seguridad garantizada</p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="order-2 lg:order-1 text-center">
                                <div className="text-9xl mb-4">🛍️</div>
                                <p className="text-lg text-gray-500">Cientos de marcas disponibles</p>
                            </div>
                            <div className="order-1 lg:order-2">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mb-6">
                                    🛍️
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                                    2. Compra normalmente
                                </h3>
                                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                                    Usa tu tarjeta vinculada en cientos de marcas y tiendas que ya conoces. No cambies tus hábitos, solo compra donde siempre compras.
                                </p>
                                <ul className="space-y-3 text-gray-600">
                                    <li className="flex items-center">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                                        Tiendas físicas y online
                                    </li>
                                    <li className="flex items-center">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                                        Sin códigos ni cupones
                                    </li>
                                    <li className="flex items-center">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                                        Detección automática
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-3xl mb-6">
                                    🏆
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                                    3. Recibe cashback automático
                                </h3>
                                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                                    Una parte del cashback va para ti, otra parte va automáticamente para la causa o equipo que elijas apoyar. ¡Es un ganar-ganar!
                                </p>
                                <ul className="space-y-3 text-gray-600">
                                    <li className="flex items-center">
                                        <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                                        Cashback instantáneo para ti
                                    </li>
                                    <li className="flex items-center">
                                        <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                                        Donación automática para tu causa
                                    </li>
                                    <li className="flex items-center">
                                        <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                                        Seguimiento en tiempo real
                                    </li>
                                </ul>
                            </div>
                            <div className="text-center">
                                <div className="text-9xl mb-4">💰</div>
                                <p className="text-lg text-gray-500">Impacto automático garantizado</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 md:py-20 lg:py-24">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
                        Preguntas frecuentes
                    </h2>
                    <div className="max-w-3xl mx-auto space-y-8">
                        <details className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors duration-200">
                            <summary className="text-xl font-semibold text-gray-900 cursor-pointer">
                                ¿Es realmente gratis?
                            </summary>
                            <p className="mt-4 text-gray-600 leading-relaxed">
                                Sí, completamente gratis para consumidores. Los comercios pagan una pequeña comisión que permite que funcione todo el sistema de cashback.
                            </p>
                        </details>
                        <details className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors duration-200">
                            <summary className="text-xl font-semibold text-gray-900 cursor-pointer">
                                ¿Qué tan seguro es?
                            </summary>
                            <p className="mt-4 text-gray-600 leading-relaxed">
                                Usamos los mismos estándares de seguridad que los bancos. Tu información está encriptada y nunca almacenamos datos de tarjetas completos.
                            </p>
                        </details>
                        <details className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors duration-200">
                            <summary className="text-xl font-semibold text-gray-900 cursor-pointer">
                                ¿Cuánto cashback recibo?
                            </summary>
                            <p className="mt-4 text-gray-600 leading-relaxed">
                                El cashback varía según la tienda, típicamente entre 1% y 10%. Una parte va para ti y otra para tu causa elegida.
                            </p>
                        </details>
                        <details className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors duration-200">
                            <summary className="text-xl font-semibold text-gray-900 cursor-pointer">
                                ¿Cómo elijo mi causa?
                            </summary>
                            <p className="mt-4 text-gray-600 leading-relaxed">
                                Puedes elegir entre equipos registrados en la plataforma o cambiar tu causa en cualquier momento desde tu perfil.
                            </p>
                        </details>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 md:py-20 lg:py-24 bg-blue-600">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        ¿Listo para comenzar?
                    </h2>
                    <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                        Únete a miles de personas que ya están generando impacto con sus compras diarias.
                    </p>
                    <Link to="/signup">
                        <Button className="h-12 px-8 text-lg font-semibold bg-white hover:bg-gray-100 text-blue-600 rounded-3xl">
                            Crear cuenta gratis
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    )
}