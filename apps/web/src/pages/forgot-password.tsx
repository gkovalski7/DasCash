import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { requestPasswordReset } from '../lib/api'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await requestPasswordReset(email)
            setSent(true)
        } catch (err: any) {
            setError(err?.message || 'Error al enviar el email. Intentá de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    if (sent) {
        return (
            <div className="min-h-screen bg-white pt-20 pb-16">
                <div className="mx-auto max-w-md px-6">
                    <div className="rounded-lg bg-green-50 border border-green-200 p-8 text-center">
                        <div className="text-4xl mb-4">📧</div>
                        <h2 className="text-xl font-semibold text-green-800 mb-2">Revisá tu email</h2>
                        <p className="text-green-700 text-sm">
                            Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
                        </p>
                        <p className="text-green-600 text-xs mt-3">
                            El enlace es válido por 1 hora.
                        </p>
                    </div>
                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                            ← Volver al inicio de sesión
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white pt-20 pb-16">
            <div className="mx-auto max-w-md px-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">¿Olvidaste tu contraseña?</h1>
                    <p className="text-gray-600 mt-2">
                        Ingresá tu email y te enviamos un enlace para restablecerla.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="tu@email.com"
                            required
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full py-3">
                        {loading ? 'Enviando...' : 'Enviar enlace'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                        ← Volver al inicio de sesión
                    </Link>
                </div>
            </div>
        </div>
    )
}
