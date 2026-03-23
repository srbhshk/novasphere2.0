import { render, screen } from '@testing-library/react'
import type {
  BentoCardConfig,
  BentoLayoutConfig,
  BentoModuleRegistry,
} from '../bento.types'
import { BentoGrid } from './BentoGrid'

function createCard(
  id: string,
  overrides: Partial<BentoCardConfig> = {},
): BentoCardConfig {
  return {
    id,
    moduleId: 'test-module',
    colSpan: 6,
    rowSpan: 1,
    title: id,
    visible: true,
    order: 0,
    ...overrides,
  }
}

const TestModuleRegistry: BentoModuleRegistry = {
  'test-module': ({ config }) => (
    <div data-testid={`module-${config.id}`}>{config.title}</div>
  ),
}

describe('BentoGrid', () => {
  it('renders correct number of visible cards', () => {
    const layout: BentoLayoutConfig = [
      createCard('a', { visible: true }),
      createCard('b', { visible: false }),
      createCard('c', { visible: true }),
    ]

    render(<BentoGrid layout={layout} modules={TestModuleRegistry} />)

    expect(screen.getAllByTestId(/module-/)).toHaveLength(2)
  })

  it('sorts cards by order', () => {
    const layout: BentoLayoutConfig = [
      createCard('a', { order: 2 }),
      createCard('b', { order: 0 }),
      createCard('c', { order: 1 }),
    ]

    render(<BentoGrid layout={layout} modules={TestModuleRegistry} />)

    const rendered = screen.getAllByTestId(/module-/)
    expect(rendered.map((el) => el.textContent)).toEqual(['b', 'c', 'a'])
  })

  it('renders placeholder for unknown module', () => {
    const layout: BentoLayoutConfig = [createCard('a', { moduleId: 'unknown-module' })]

    render(<BentoGrid layout={layout} modules={{}} />)

    expect(screen.getByText(/Module not found/i)).toBeInTheDocument()
  })

  it('renders empty grid without crashing when layout is empty', () => {
    const layout: BentoLayoutConfig = []

    const { container } = render(
      <BentoGrid layout={layout} modules={TestModuleRegistry} />,
    )

    expect(container.firstChild).toBeTruthy()
  })
})
