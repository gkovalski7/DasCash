import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SignupPage from './signup'
import { post, fetchCauses } from '../lib/api'

vi.mock('../lib/api', () => ({
  post: vi.fn(),
  fetchCauses: vi.fn(),
}))

const causes = [
  { id: 10, title: 'Club Deportivo', slug: 'club', category: 'Deporte' },
  { id: 20, title: 'Escuela 12', slug: 'escuela-12', category: 'Educación' },
]

async function fillAndSubmit() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), 'nuevo@test.com')
  await user.type(screen.getByLabelText('Contraseña'), 'password123')
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'password123')
  return user
}

describe('SignupPage — causa preferida', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchCauses).mockResolvedValue(causes as any)
    vi.mocked(post).mockResolvedValue({})
  })

  it('envía preferred_cause cuando se elige una causa', async () => {
    render(<MemoryRouter><SignupPage /></MemoryRouter>)
    const user = await fillAndSubmit()
    await user.click(await screen.findByRole('button', { name: /Club Deportivo/ }))
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(post).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({ preferred_cause: 10 })
    )
  })

  it('no envía preferred_cause cuando no se elige ninguna', async () => {
    render(<MemoryRouter><SignupPage /></MemoryRouter>)
    const user = await fillAndSubmit()
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    const body = vi.mocked(post).mock.calls[0][1] as Record<string, unknown>
    expect(body).not.toHaveProperty('preferred_cause')
  })

  it('deseleccionar la causa la quita del payload', async () => {
    render(<MemoryRouter><SignupPage /></MemoryRouter>)
    const user = await fillAndSubmit()
    const causeBtn = await screen.findByRole('button', { name: /Club Deportivo/ })
    await user.click(causeBtn)
    await user.click(causeBtn)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    const body = vi.mocked(post).mock.calls[0][1] as Record<string, unknown>
    expect(body).not.toHaveProperty('preferred_cause')
  })

  it('el registro funciona aunque las causas no carguen', async () => {
    vi.mocked(fetchCauses).mockRejectedValue(new Error('network'))
    render(<MemoryRouter><SignupPage /></MemoryRouter>)
    const user = await fillAndSubmit()
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(post).toHaveBeenCalled()
  })
})
