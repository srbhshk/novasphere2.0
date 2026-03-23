import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignupForm } from './SignupForm'
import type { AuthAdapter } from '../auth.adapter.interface'
import type { AuthSession } from '../auth.types'

function makeAdapter(overrides: Partial<AuthAdapter> = {}): AuthAdapter {
  return {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    resetPassword: vi.fn(),
    ...overrides,
  }
}

const mockSession: AuthSession = {
  userId: 'u1',
  email: 'new@example.com',
  name: 'New User',
  tenantId: 't1',
  role: 'viewer',
  plan: 'pro',
}

describe('SignupForm', () => {
  it('renders name, email, password, confirm password fields', () => {
    const adapter = makeAdapter()
    render(<SignupForm adapter={adapter} />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('calls adapter.signUp with values on submit', async () => {
    const user = userEvent.setup()
    const signUp = vi
      .fn()
      .mockResolvedValue({ success: true as const, session: mockSession })
    const adapter = makeAdapter({ signUp })
    render(<SignupForm adapter={adapter} />)
    await user.type(screen.getByLabelText(/name/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    const buttons = screen.getAllByRole('button')
    const submit = buttons.find((b) => b.getAttribute('type') === 'submit')
    if (submit) await user.click(submit)
    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      })
    })
  })
})
