import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUser } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function AdminMerchantNewPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [merchantName, setMerchantName] = useState('')
    const [cuit, setCuit] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [step, setStep] = useState<'form' | 'done'>('form')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await createUser({
                email,
                password,
                role: 'MERCHANT',
                merchant_name: merchantName,
                merchant_cuit: cuit,
            })
            setStep('done')
        } catch (err: any) {
            setError(err.message || 'Error al crear merchant')
        } finally {
            setLoading(false)
        }
    }

    if (step === 'done') {
        return (
            <Card className="text-center py-8">
                <p className="text-green-700 font-medium mb-2">Merchant creado exitosamente</p>
                <p className="text-sm text-gray-500 mb-4">Se creó el usuario MERCHANT y el merchant vinculado.</p>
                <div className="flex justify-center gap-3">
                    <Button onClick={() => navigate('/app/admin/merchants')} className="h-9 px-4 text-sm">
                        Volver a Merchants
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setStep('form')
                            setEmail('')
                            setPassword('')
                            setMerchantName('')
                            setCuit('')
                        }}
                        className="h-9 px-4 text-sm"
                    >
                        Crear otro
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Merchant</h2>
            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
                    )}

                    <fieldset className="space-y-3">
                        <legend className="text-sm font-medium text-gray-700 mb-2">Usuario MERCHANT</legend>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="merchant@email.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Contraseña inicial</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Mínimo 8 caracteres"
                            />
                        </div>
                    </fieldset>

                    <fieldset className="space-y-3">
                        <legend className="text-sm font-medium text-gray-700 mb-2">Datos del Merchant</legend>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Nombre del comercio</label>
                            <input
                                type="text"
                                required
                                value={merchantName}
                                onChange={e => setMerchantName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">CUIT</label>
                            <input
                                type="text"
                                required
                                value={cuit}
                                onChange={e => setCuit(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="20-12345678-9"
                            />
                        </div>
                    </fieldset>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={loading} className="h-9 px-4 text-sm">
                            {loading ? 'Creando...' : 'Crear Merchant'}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/app/admin/merchants')}
                            className="h-9 px-4 text-sm"
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
