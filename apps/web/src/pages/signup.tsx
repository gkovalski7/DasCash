import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { post } from '../lib/api'

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (!email || !password || !confirm) return setError('Completá todos los campos.')
        if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
        if (password !== confirm) return setError('Las contraseñas no coinciden.')
        setLoading(true)
        try {
            // API expects username; we default it to email on backend, but send explicitly for compatibility
            await post('/api/auth/register', { email, username: email, password, role: 'CONSUMER' })
            setSuccess(true)
        } catch (err: any) {
            setError(err?.message || 'Error al registrarse')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white pt-20 pb-16">
            <div className="mx-auto max-w-md px-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Crear cuenta</h1>
                    <p className="text-gray-600 mt-2">Únete y empieza a generar impacto con tus compras</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-green-800 text-sm">Registro exitoso. ¡Podés iniciar sesión!</p>
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

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Mínimo 8 caracteres"
                            required
                            minLength={8}
                        />
                    </div>

                    <div>
                        <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirmar contraseña
                        </label>
                        <input
                            type="password"
                            id="confirm"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Confirma tu contraseña"
                            required
                            minLength={8}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3"
                    >
                        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                            Iniciar sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
