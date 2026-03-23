import { render } from '@testing-library/react'
import { GlassPanel } from './GlassPanel'

describe('GlassPanel', () => {
  it('renders children', () => {
    const { getByText } = render(<GlassPanel>Body</GlassPanel>)
    expect(getByText('Body')).toBeInTheDocument()
  })

  it('renders header when provided', () => {
    const { getByText } = render(<GlassPanel header="Header text">Body</GlassPanel>)
    expect(getByText('Header text')).toBeInTheDocument()
  })

  it('renders footer when provided', () => {
    const { getByText } = render(<GlassPanel footer="Footer text">Body</GlassPanel>)
    expect(getByText('Footer text')).toBeInTheDocument()
  })

  it('uses strong variant by default', () => {
    const { getByText } = render(<GlassPanel>Body</GlassPanel>)
    const element = getByText('Body').closest('section')
    expect(element?.className).toContain('strong')
  })
})
