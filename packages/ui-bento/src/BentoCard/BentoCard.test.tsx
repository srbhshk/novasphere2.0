import { render, screen } from '@testing-library/react'
import type { BentoCardConfig } from '../bento.types'
import { BentoCard } from './BentoCard'

const baseConfig: BentoCardConfig = {
  id: 'card-1',
  moduleId: 'test',
  colSpan: 6,
  rowSpan: 1,
  title: 'Test Card',
  visible: true,
  order: 0,
}

describe('BentoCard', () => {
  it('renders children', () => {
    render(
      <BentoCard config={baseConfig}>
        <div data-testid="child">child</div>
      </BentoCard>,
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(
      <BentoCard config={baseConfig}>
        <div />
      </BentoCard>,
    )

    expect(screen.getByText('Test Card')).toBeInTheDocument()
  })
})
