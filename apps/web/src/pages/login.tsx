import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { post } from '../lib/api'
import { setTokens, setUserEmail } from '../lib/auth'

export default function LoginPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (!email || !password) return setError('Completá todos los campos.')
        setLoading(true)
        try {
            // Send both email and username for maximum compatibility with the auth endpoint
            const data = await post<{ access: string; refresh: string }>('/api/auth/login', { email, username: email, password })
            setTokens({ access: data.access, refresh: data.refresh })
            setUserEmail(email)
            setSuccess(true)
            navigate('/app/home', { replace: true })
        } catch (err: any) {
            setError(err?.message || 'Error al iniciar sesión')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-white pt-20 pb-16">
                <div className="mx-auto max-w-md px-6">
                    <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
                        <h2 className="text-xl font-semibold text-green-800 mb-2">¡Bienvenido de vuelta!</h2>
                        <p className="text-green-700">Has iniciado sesión correctamente.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white pt-20 pb-16">
            <div className="mx-auto max-w-md px-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h1>
                    <p className="text-gray-600 mt-2">Ingresa a tu cuenta para continuar</p>
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
                            placeholder="Tu contraseña"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3"
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                </form>

                <div className="mt-4 text-center">
                    <Link to="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                        ¿No tienes cuenta?{' '}
                        <Link to="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                            Crear cuenta
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}