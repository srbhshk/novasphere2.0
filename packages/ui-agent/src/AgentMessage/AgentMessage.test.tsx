import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgentMessage } from './AgentMessage'

describe('AgentMessage', () => {
  it('renders user messages with user role', () => {
    render(
      <AgentMessage
        message={{
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: Date.now(),
        }}
      />,
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
    const userMessage = document.querySelector('[data-role="user"]')
    expect(userMessage).toBeInTheDocument()
    expect(userMessage).toHaveTextContent('Hello')
  })

  it('renders assistant messages with assistant role', () => {
    render(
      <AgentMessage
        message={{
          id: '2',
          role: 'assistant',
          content: 'Hi there',
          timestamp: Date.now(),
        }}
      />,
    )
    expect(screen.getByText('Hi there')).toBeInTheDocument()
  })

  it('adds streaming indicator when isStreaming is true', () => {
    const { container } = render(
      <AgentMessage
        message={{
          id: '3',
          role: 'assistant',
          content: 'Streaming...',
          timestamp: Date.now(),
        }}
        isStreaming
      />,
    )
    expect(screen.getByText('Streaming...')).toBeInTheDocument()
    const cursor = container.querySelector('[aria-hidden]')
    expect(cursor).toBeTruthy()
  })
})
