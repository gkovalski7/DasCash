import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { post } from '../lib/api'

export default function ForMerchantsPage() {
    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [data, setData] = useState({
        businessName: '',
        contactName: '',
        email: '',
        phone: '',
        website: '',
        city: '',
        stores: '',
        notes: '',
        accept: false,
    })

    const handleToggleForm = () => setShowForm(true)
    const closeModal = () => setShowForm(false)

    // Bloquear scroll de fondo y cerrar con ESC cuando el modal esté abierto
    useEffect(() => {
        if (showForm) {
            const onKey = (e: KeyboardEvent) => {
                if (e.key === 'Escape') closeModal()
            }
            document.body.style.overflow = 'hidden'
            window.addEventListener('keydown', onKey)
            return () => {
                document.body.style.overflow = ''
                window.removeEventListener('keydown', onKey)
            }
        }
    }, [showForm])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (!data.businessName || !data.contactName || !data.email || !data.accept) {
            return setError('Completá los campos requeridos (*).')
        }
        setLoading(true)
        try {
            // Endpoint sugerido. En el backend, implementar envío de correo.
            await post('/api/contact/merchant-lead', {
                business_name: data.businessName,
                contact_name: data.contactName,
                email: data.email,
                phone: data.phone,
                website: data.website,
                city: data.city,
                stores: data.stores,
                notes: data.notes,
            })
            setSuccess('¡Gracias! Recibimos tu solicitud y te contactaremos a la brevedad.')
            setData({
                businessName: '', contactName: '', email: '', phone: '', website: '', city: '', stores: '', notes: '', accept: false,
            })
        } catch (err: any) {
            // Fallback opcional: abrir cliente de correo si falla el POST
            try {
                const subject = encodeURIComponent('Solicitud de comercio – DasCash')
                const body = encodeURIComponent(
                    `Negocio: ${data.businessName}\nContacto: ${data.contactName}\nEmail: ${data.email}\nTeléfono: ${data.phone}\nSitio web: ${data.website}\nCiudad: ${data.city}\nTiendas: ${data.stores}\nNotas: ${data.notes}`
                )
                window.location.href = `mailto:contacto@cashback.local?subject=${subject}&body=${body}`
                setSuccess('Abrimos tu cliente de correo para completar el envío.')
            } catch { }
            setError(err?.message || 'No pudimos enviar tu solicitud. Intenta nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement
        setData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    return (
        <div className="bg-white">
            {/* Hero Section - fullscreen */}
            <section className="relative min-h-[calc(100vh-4rem)] flex items-center">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10 text-center w-full">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.05] tracking-tight mb-8">
                        Atrae clientes leales<br />
                        <span className="text-blue-600">con cashback</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
                        Aumenta tus ventas y fideliza clientes ofreciendo cashback automático. Conviértete en el lugar preferido de la comunidad y genera impacto social.
                    </p>
                    <Button onClick={handleToggleForm} className="h-12 px-8 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-3xl">
                        Unirse como comercio
                    </Button>
                </div>
            </section>

            {/* Modal Form for Merchants */}
            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="merchant-lead-title"
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

                    {/* Dialog */}
                    <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-gray-200 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <h2 id="merchant-lead-title" className="text-xl md:text-2xl font-bold text-gray-900">Contanos sobre tu negocio</h2>
                            <button
                                aria-label="Cerrar"
                                onClick={closeModal}
                                className="rounded-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 8.586l4.95-4.95 1.414 1.414L11.414 10l4.95 4.95-1.414 1.414L10 11.414l-4.95 4.95-1.414-1.414L8.586 10l-4.95-4.95L5.05 3.636 10 8.586z" clipRule="evenodd" /></svg>
                            </button>
                        </div>

                        <div className="px-5 pt-4 pb-6 overflow-y-auto flex-1">
                            <p className="text-gray-600 mb-4">Completá el formulario y nos pondremos en contacto para ayudarte a incorporar cashback en tu tienda.</p>

                            {error && (
                                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
                            )}
                            {success && (
                                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{success}</div>
                            )}

                            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del negocio *</label>
                                    <input name="businessName" value={data.businessName} onChange={onChange} placeholder="Ej: Tienda Sports SA" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de contacto *</label>
                                    <input name="contactName" value={data.contactName} onChange={onChange} placeholder="Nombre y apellido" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                    <input type="email" name="email" value={data.email} onChange={onChange} placeholder="contacto@negocio.com" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                                    <input name="phone" value={data.phone} onChange={onChange} placeholder="+54 11 5555-5555" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sitio web</label>
                                    <input name="website" value={data.website} onChange={onChange} placeholder="https://tusitio.com" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
                                    <input name="city" value={data.city} onChange={onChange} placeholder="Buenos Aires" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad de tiendas</label>
                                    <input name="stores" value={data.stores} onChange={onChange} placeholder="1" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                                    <textarea name="notes" value={data.notes} onChange={onChange} rows={4} placeholder="Contanos sobre tu negocio (ej. rubro, promedio de compra, etc.)" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                                </div>
                                <div className="md:col-span-2 flex items-start gap-2">
                                    <input id="accept" name="accept" type="checkbox" checked={data.accept} onChange={onChange} className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    <label htmlFor="accept" className="text-sm text-gray-600">Acepto ser contactado por la plataforma de cashback *</label>
                                </div>

                                <div className="md:col-span-2 flex items-center justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="h-10 px-4 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50">Cancelar</button>
                                    <Button type="submit" disabled={loading} className="h-10 px-6 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-full">
                                        {loading ? 'Enviando…' : 'Enviar solicitud'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Benefits for merchants */}
            <section className="py-16 md:py-20 lg:py-24 bg-gray-50">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
                        Beneficios para tu negocio
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
                            <div className="text-6xl mb-6">👥</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                Nuevos clientes
                            </h3>
                            <p className="text-gray-600">
                                Atrae compradores comprometidos con causas locales que buscan generar impacto.
                            </p>
                        </div>
                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
                            <div className="text-6xl mb-6">🔄</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                Lealtad aumentada
                            </h3>
                            <p className="text-gray-600">
                                Los clientes regresan porque cada compra apoya sus causas favoritas.
                            </p>
                        </div>
                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
                            <div className="text-6xl mb-6">🏪</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                Impacto comunitario
                            </h3>
                            <p className="text-gray-600">
                                Posiciona tu negocio como un pilar que apoya el deporte y causas locales.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works for merchants */}
            <section className="py-16 md:py-20 lg:py-24">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
                        Cómo funciona
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="flex items-start">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mr-4 flex-shrink-0">
                                    ⚙️
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        Configuración simple
                                    </h3>
                                    <p className="text-gray-600">
                                        Integración rápida con tu sistema de pagos existente. Sin cambios complejos.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl mr-4 flex-shrink-0">
                                    💳
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        Cashback automático
                                    </h3>
                                    <p className="text-gray-600">
                                        Los clientes reciben cashback automáticamente al comprar contigo.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl mr-4 flex-shrink-0">
                                    📊
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        Analíticas detalladas
                                    </h3>
                                    <p className="text-gray-600">
                                        Observa el impacto en ventas y el crecimiento de tu base de clientes.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-8xl mb-6">🏆</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                Comercios exitosos confían en nosotros
                            </h3>
                            <p className="text-gray-600 text-lg">
                                Desde tiendas locales hasta cadenas regionales, todos ven crecimiento con nuestro programa.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 md:py-20 lg:py-24 bg-green-600">
                <div className="max-w-screen-xl mx-auto px-6 md:px-8 lg:px-10 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Únete a la red de comercios
                    </h2>
                    <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
                        Forma parte de la comunidad de negocios que apoyan el deporte y las causas locales.
                    </p>
                    <Button onClick={handleToggleForm} className="h-12 px-8 text-lg font-semibold bg-white hover:bg-gray-100 text-green-600 rounded-3xl">
                        Comenzar ahora
                    </Button>
                </div>
            </section>
        </div>
    )
}
