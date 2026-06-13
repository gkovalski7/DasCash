import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PagoExitoso from './PagoExitoso'
import { getPurchaseImpact } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  getPurchaseImpact: vi.fn(),
}))

function setSession() {
  sessionStorage.setItem('dc_purchase_id', '42')
  sessionStorage.setItem('dc_cashback', '70')
  sessionStorage.setItem('dc_cause', 'tu club')
  sessionStorage.setItem('dc_store', 'Súper Test')
}

describe('PagoExitoso — reconciliación', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })
  afterEach(() => {
    sessionStorage.clear()
  })

  it('al confirmar el webhook muestra el monto real y la barra de la meta', async () => {
    setSession()
    vi.mocked(getPurchaseImpact).mockResolvedValue({
      status: 'APPROVED',
      contribution: '75.00',
      cause_title: 'Club Deportivo Barrial',
      goal: { title: 'Camisetas', target_amount: '1000.00', current_amount: '75.00', percent: 7 },
    })
    render(<MemoryRouter><PagoExitoso /></MemoryRouter>)
    expect(await screen.findByText('Camisetas')).toBeDefined()
    expect(screen.getByText(/Club Deportivo Barrial/)).toBeDefined()
    expect(getPurchaseImpact).toHaveBeenCalledWith(42)
  })

  it('sin meta no muestra barra (degrada al texto de aporte)', async () => {
    setSession()
    vi.mocked(getPurchaseImpact).mockResolvedValue({
      status: 'APPROVED', contribution: '75.00', cause_title: 'tu club', goal: null,
    })
    render(<MemoryRouter><PagoExitoso /></MemoryRouter>)
    await waitFor(() => expect(getPurchaseImpact).toHaveBeenCalled())
    expect(screen.queryByTestId('goal-bar-fill')).toBeNull()
  })

  it('sin dc_purchase_id no llama al endpoint', async () => {
    render(<MemoryRouter><PagoExitoso /></MemoryRouter>)
    await new Promise((r) => setTimeout(r, 50))
    expect(getPurchaseImpact).not.toHaveBeenCalled()
  })
})
