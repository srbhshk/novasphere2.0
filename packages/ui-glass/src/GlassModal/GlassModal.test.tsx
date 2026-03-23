import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlassModal } from './GlassModal'

describe('GlassModal', () => {
  it('renders title and children when open', () => {
    const { getByText } = render(
      <GlassModal open onOpenChange={() => {}} title="My modal" description="Description">
        <p>Body content</p>
      </GlassModal>,
    )

    expect(getByText('My modal')).toBeInTheDocument()
    expect(getByText('Body content')).toBeInTheDocument()
  })

  it('calls onOpenChange when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const handleOpenChange = vi.fn()

    const { container } = render(
      <GlassModal open onOpenChange={handleOpenChange} title="Title">
        Content
      </GlassModal>,
    )

    const backdrop = container.querySelector(
      '[data-testid="glass-backdrop"]',
    ) as HTMLDivElement | null
    await user.click(backdrop as HTMLDivElement)
    expect(handleOpenChange).toHaveBeenCalled()
  })
})
