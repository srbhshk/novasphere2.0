import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlassCard } from './GlassCard'

describe('GlassCard', () => {
  it('renders children', () => {
    const { getByText } = render(<GlassCard>Content</GlassCard>)
    expect(getByText('Content')).toBeInTheDocument()
  })

  it('uses medium variant by default', () => {
    const { getByText } = render(<GlassCard>Default</GlassCard>)
    const element = getByText('Default').closest('div')
    expect(element?.className).toContain('medium')
  })

  it('applies hover class when hover is true', async () => {
    const user = userEvent.setup()
    const { getByText } = render(<GlassCard hover>Hover</GlassCard>)
    const element = getByText('Hover').closest('div') as HTMLDivElement | null
    expect(element?.className).toContain('hover')
    await user.hover(element as HTMLElement)
  })

  it('applies highlight class when highlight is true', () => {
    const { getByText } = render(<GlassCard highlight>Highlight</GlassCard>)
    const element = getByText('Highlight').closest('div')
    expect(element?.className).toContain('highlight')
  })

  it('merges custom className', () => {
    const { getByText } = render(<GlassCard className="custom-class">Custom</GlassCard>)
    const element = getByText('Custom').closest('div')
    expect(element?.className).toContain('custom-class')
  })
})
