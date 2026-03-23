import { render, screen } from '@testing-library/react'
import type { DonutSegment } from '../chart.types'
import { DonutChart } from './DonutChart'

describe('DonutChart', () => {
  const data: DonutSegment[] = [
    { id: 'a', label: 'A', value: 10 },
    { id: 'b', label: 'B', value: 20 },
  ]

  it('shows skeleton when loading', () => {
    const { container } = render(<DonutChart data={data} loading height={120} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(<DonutChart data={[]} />)
    expect(screen.getByText(/No data available/i)).toBeInTheDocument()
  })

  it('renders segments and legend when data is present', () => {
    render(<DonutChart data={data} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })
})
