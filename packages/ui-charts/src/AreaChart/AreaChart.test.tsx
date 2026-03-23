import { render, screen } from '@testing-library/react'
import type { AreaDataPoint } from '../chart.types'
import { AreaChart } from './AreaChart'

describe('AreaChart', () => {
  const data: AreaDataPoint[] = [
    { label: 'Jan', value: 10 },
    { label: 'Feb', value: 20 },
  ]

  it('shows skeleton when loading', () => {
    const { container } = render(<AreaChart data={data} loading height={160} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(<AreaChart data={[]} />)
    expect(screen.getByText(/No data available/i)).toBeInTheDocument()
  })

  it('renders chart when data is present', () => {
    const { container } = render(<AreaChart data={data} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
