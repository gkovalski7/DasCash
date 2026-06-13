import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './login'
import SignupPage from './signup'
import { post } from '../lib/api'

vi.mock('../lib/api', () => ({
    post: vi.fn(),
    fetchCauses: vi.fn().mockResolvedValue([]),
}))

function renderLogin(state?: Record<string, unknown>) {
    return render(
        <MemoryRouter initialEntries={[{ pathname: '/login', state }]}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/app/home" element={<div>PANTALLA_HOME</div>} />
                <Route path="/app/pagar/:slug" element={<div>PANTALLA_PAGAR</div>} />
            </Routes>
        </MemoryRouter>
    )
}

async function submitLogin() {
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), 'cliente@test.com')
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))
}

describe('LoginPage — redirección post-login', () => {
    beforeEach(() => {
        vi.mocked(post).mockResolvedValue({ access: 'token-a', refresh: 'token-r' })
        localStorage.clear()
    })

    it('redirige a la ruta de origen (state.from) tras login exitoso', async () => {
        renderLogin({ from: { pathname: '/app/pagar/super-lee' } })
        await submitLogin()
        expect(await screen.findByText('PANTALLA_PAGAR')).toBeDefined()
    })

    it('redirige a /app/home cuando no hay ruta de origen', async () => {
        renderLogin()
        await submitLogin()
        expect(await screen.findByText('PANTALLA_HOME')).toBeDefined()
    })

    it('conserva la ruta de origen al pasar por crear cuenta y volver al login', async () => {
        const user = userEvent.setup()
        renderLogin({ from: { pathname: '/app/pagar/super-lee' } })
        await user.click(screen.getByRole('link', { name: 'Crear cuenta' }))
        await user.click(await screen.findByRole('link', { name: 'Iniciar sesión' }))
        await submitLogin()
        expect(await screen.findByText('PANTALLA_PAGAR')).toBeDefined()
    })
})
