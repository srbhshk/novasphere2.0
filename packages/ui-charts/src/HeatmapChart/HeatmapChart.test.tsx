import { render, screen } from '@testing-library/react'
import type { HeatmapCell } from '../chart.types'
import { HeatmapChart } from './HeatmapChart'

describe('HeatmapChart', () => {
  const data: HeatmapCell[] = [
    { week: 0, day: 0, value: 10 },
    { week: 1, day: 1, value: 50 },
  ]

  it('shows loading placeholder when loading', () => {
    const { container } = render(<HeatmapChart data={data} loading height={100} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(<HeatmapChart data={[]} />)
    expect(screen.getByText(/No activity yet/i)).toBeInTheDocument()
  })

  it('renders cells when data present', () => {
    const { container } = render(<HeatmapChart data={data} />)
    const cells = container.querySelectorAll('[aria-label]')
    expect(cells.length).toBeGreaterThan(0)
  })
})
