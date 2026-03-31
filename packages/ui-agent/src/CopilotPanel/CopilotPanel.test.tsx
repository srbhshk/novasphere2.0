import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopilotPanel } from './CopilotPanel'

const defaultProps = {
  messages: [],
  isLoading: false,
  adapterType: null,
  adapterModel: null,
  adapterStatus: 'idle' as const,
  onSend: vi.fn(),
}

describe('CopilotPanel', () => {
  it('renders with empty messages', () => {
    render(<CopilotPanel {...defaultProps} />)
    expect(
      screen.getByPlaceholderText(
        /Ask about signals, risks, or how to optimize the dashboard/i,
      ),
    ).toBeInTheDocument()
  })

  it('calls onSend when send button is clicked', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<CopilotPanel {...defaultProps} onSend={onSend} />)
    const input = screen.getByPlaceholderText(
      /Ask about signals, risks, or how to optimize the dashboard/i,
    )
    await user.type(input, 'Hello')
    const sendButton = screen.getByRole('button', { name: /send/i })
    fireEvent.click(sendButton)
    expect(onSend).toHaveBeenCalledWith('Hello')
  })

  it('calls onSend when Enter is pressed in textarea', async () => {
    const onSend = vi.fn()
    render(<CopilotPanel {...defaultProps} onSend={onSend} />)
    const input = screen.getByPlaceholderText(
      /Ask about signals, risks, or how to optimize the dashboard/i,
    )
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })
    expect(onSend).toHaveBeenCalledWith('Test message')
  })

  it('disables input when isLoading is true', () => {
    render(<CopilotPanel {...defaultProps} isLoading />)
    expect(
      screen.getByPlaceholderText(
        /Ask about signals, risks, or how to optimize the dashboard/i,
      ),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('renders agentName in header', () => {
    render(<CopilotPanel {...defaultProps} agentName="CustomAgent" />)
    expect(screen.getByText('CustomAgent')).toBeInTheDocument()
  })
})
