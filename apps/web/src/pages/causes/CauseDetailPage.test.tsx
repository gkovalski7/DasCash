import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import CauseDetailPage from './CauseDetailPage'
import { fetchCauseBySlug } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  fetchCauseBySlug: vi.fn(),
}))

const baseCause = {
  id: 1, title: 'Club X', slug: 'club-x', category: 'Deporte', summary: 'Un club',
  image_url: '', is_featured: false, is_active: true,
  created_at: '', updated_at: '',
}

function renderAt() {
  return render(
    <MemoryRouter initialEntries={['/causas/club-x']}>
      <Routes>
        <Route path="/causas/:slug" element={<CauseDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CauseDetailPage — barra de meta', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra la barra cuando la causa tiene meta activa', async () => {
    vi.mocked(fetchCauseBySlug).mockResolvedValue({
      ...baseCause,
      active_goal: { title: 'Camisetas', target_amount: '1000.00', current_amount: '250.00', percent: 25 },
    } as any)
    renderAt()
    expect(await screen.findByText('Camisetas')).toBeDefined()
    expect(screen.getByTestId('goal-bar-fill').style.width).toBe('25%')
  })

  it('no muestra barra si no hay meta', async () => {
    vi.mocked(fetchCauseBySlug).mockResolvedValue({ ...baseCause, active_goal: null } as any)
    renderAt()
    expect((await screen.findAllByText('Club X')).length).toBeGreaterThan(0)
    expect(screen.queryByTestId('goal-bar-fill')).toBeNull()
  })
})
