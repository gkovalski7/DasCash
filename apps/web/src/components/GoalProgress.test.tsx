import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import GoalProgress from './GoalProgress'

describe('GoalProgress', () => {
  it('muestra título, montos y porcentaje', () => {
    render(
      <GoalProgress title="Camisetas" currentAmount="250.00" targetAmount="1000.00" percent={25} />
    )
    expect(screen.getByText('Camisetas')).toBeDefined()
    expect(screen.getByText(/25%/)).toBeDefined()
    const bar = screen.getByTestId('goal-bar-fill')
    expect(bar.style.width).toBe('25%')
  })

  it('muestra meta cumplida al 100%', () => {
    render(
      <GoalProgress title="M" currentAmount="1200.00" targetAmount="1000.00" percent={100} />
    )
    expect(screen.getByText(/Meta cumplida/i)).toBeDefined()
    expect(screen.getByTestId('goal-bar-fill').style.width).toBe('100%')
  })
})
