import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PagarComercio from './PagarComercio'
import { get, getProfile } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  getProfile: vi.fn(),
}))

const storeData = {
  id: 1,
  name: 'Súper Test',
  address: 'Calle 1',
  description: '',
  logo_url: '',
  cashback_percentage: '5.00',
  supported_causes: [
    { id: 10, title: 'Club Deportivo', slug: 'club', image_url: '', category: 'Deporte' },
    { id: 20, title: 'Básquet de Base', slug: 'basquet', image_url: '', category: 'Deporte' },
  ],
}

function renderPagar() {
  return render(
    <MemoryRouter initialEntries={['/app/pagar/super-test']}>
      <Routes>
        <Route path="/app/pagar/:slug" element={<PagarComercio />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PagarComercio — causa preferida', () => {
  beforeEach(() => {
    vi.mocked(get).mockResolvedValue(storeData)
  })

  it('preselecciona la causa preferida del usuario si la tienda la soporta', async () => {
    vi.mocked(getProfile).mockResolvedValue({ preferred_cause: 20 } as any)
    renderPagar()
    const btn = await screen.findByRole('button', { name: /Básquet de Base/ })
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })

  it('cae a la primera causa cuando no hay preferida', async () => {
    vi.mocked(getProfile).mockResolvedValue({ preferred_cause: null } as any)
    renderPagar()
    const btn = await screen.findByRole('button', { name: /Club Deportivo/ })
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })

  it('cae a la primera causa si el perfil falla (no bloquea el pago)', async () => {
    vi.mocked(getProfile).mockRejectedValue(new Error('401'))
    renderPagar()
    const btn = await screen.findByRole('button', { name: /Club Deportivo/ })
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })
})
