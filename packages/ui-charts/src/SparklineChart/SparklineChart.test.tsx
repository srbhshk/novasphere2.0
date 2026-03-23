import { render, screen } from '@testing-library/react'
import type { SparklineDataPoint } from '../chart.types'
import { SparklineChart } from './SparklineChart'

describe('SparklineChart', () => {
  const data: SparklineDataPoint[] = [
    { value: 1, label: 'A' },
    { value: 2, label: 'B' },
  ]

  it('shows skeleton when loading', () => {
    const { container } = render(<SparklineChart data={data} loading height={100} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(<SparklineChart data={[]} />)
    expect(screen.getByText(/No data available/i)).toBeInTheDocument()
  })

  it('renders chart when data is present', () => {
    const { container } = render(<SparklineChart data={data} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
