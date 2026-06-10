import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { confirmPasswordReset } from '../lib/api'

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const uid = searchParams.get('uid') ?? ''
    const token = searchParams.get('token') ?? ''

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const invalidLink = !uid || !token

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.')
            return
        }

        setLoading(true)
        try {
            await confirmPasswordReset({ uid, token, new_password: newPassword, confirm_password: confirmPassword })
            setSuccess(true)
        } catch (err: any) {
            setError(err?.message || 'El enlace es inválido o ha expirado.')
        } finally {
            setLoading(false)
        }
    }

    if (invalidLink) {
        return (
            <div className="min-h-screen bg-white pt-20 pb-16">
                <div className="mx-auto max-w-md px-6">
                    <div className="rounded-lg bg-red-50 border border-red-200 p-8 text-center">
                        <h2 className="text-xl font-semibold text-red-800 mb-2">Enlace inválido</h2>
                        <p className="text-red-700 text-sm">
                            Este enlace de recuperación es inválido o ha expirado.
                        </p>
                    </div>
                    <div className="mt-6 text-center">
                        <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                            Solicitar un nuevo enlace
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen bg-white pt-20 pb-16">
                <div className="mx-auto max-w-md px-6">
                    <div className="rounded-lg bg-green-50 border border-green-200 p-8 text-center">
                        <div className="text-4xl mb-4">✅</div>
                        <h2 className="text-xl font-semibold text-green-800 mb-2">¡Contraseña actualizada!</h2>
                        <p className="text-green-700 text-sm">
                            Tu contraseña fue restablecida correctamente.
                        </p>
                    </div>
                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                            Iniciar sesión →
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
                    <h1 className="text-3xl font-bold text-gray-900">Nueva contraseña</h1>
                    <p className="text-gray-600 mt-2">Elegí una contraseña nueva para tu cuenta.</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                            Nueva contraseña
                        </label>
                        <input
                            type="password"
                            id="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Mínimo 8 caracteres"
                            minLength={8}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirmar contraseña
                        </label>
                        <input
                            type="password"
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Repetí la contraseña"
                            minLength={8}
                            required
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full py-3">
                        {loading ? 'Guardando...' : 'Guardar contraseña'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
