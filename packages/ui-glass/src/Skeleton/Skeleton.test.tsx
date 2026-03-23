import { render } from '@testing-library/react'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders a single line by default', () => {
    const { container } = render(<Skeleton width={100} height={16} />)
    const items = container.querySelectorAll('div')
    expect(items.length).toBeGreaterThan(0)
  })

  it('renders multiple lines when lines prop is set', () => {
    const { container } = render(<Skeleton lines={3} />)
    const skeletons = container.querySelectorAll('.ns-skeleton')
    expect(skeletons.length).toBe(3)
  })
})
