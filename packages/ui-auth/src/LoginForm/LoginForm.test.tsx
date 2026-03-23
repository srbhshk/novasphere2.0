import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'
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
  email: 'u@example.com',
  name: 'User',
  tenantId: 't1',
  role: 'viewer',
  plan: 'pro',
}

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    const adapter = makeAdapter()
    render(<LoginForm adapter={adapter} />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
  })

  it('submit button (type=submit) is disabled when loading=true', () => {
    const adapter = makeAdapter()
    render(<LoginForm adapter={adapter} loading />)
    const buttons = screen.getAllByRole('button')
    const submit = buttons.find((b) => b.getAttribute('type') === 'submit')
    expect(submit).toBeDisabled()
  })

  it('calls adapter.signIn with correct credentials on submit', async () => {
    const user = userEvent.setup()
    const signIn = vi
      .fn()
      .mockResolvedValue({ success: true as const, session: mockSession })
    const adapter = makeAdapter({ signIn })
    render(<LoginForm adapter={adapter} />)
    const emailInput = screen.getByRole('textbox', { name: /email/i })
    const passwordInputs = screen.getAllByLabelText(/^password$/i)
    const passwordInput = passwordInputs[0]
    if (!passwordInput) throw new Error('Password input not found')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'secret')
    const buttons = screen.getAllByRole('button')
    const submit = buttons.find((b) => b.getAttribute('type') === 'submit')
    if (submit) await user.click(submit)
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'secret',
      })
    })
  })

  it('shows error in role="alert" on adapter.signIn failure', async () => {
    const user = userEvent.setup()
    const signIn = vi
      .fn()
      .mockResolvedValue({ success: false as const, error: 'Invalid credentials' })
    const adapter = makeAdapter({ signIn })
    render(<LoginForm adapter={adapter} />)
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'bad@example.com')
    const pwdInput = screen.getAllByLabelText(/^password$/i)[0]
    if (!pwdInput) throw new Error('Password input not found')
    await user.type(pwdInput, 'wrong')
    const buttons = screen.getAllByRole('button')
    const submit = buttons.find((b) => b.getAttribute('type') === 'submit')
    if (submit) await user.click(submit)
    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('Invalid credentials')
    })
  })

  it('calls onSuccess with session on adapter.signIn success', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const signIn = vi
      .fn()
      .mockResolvedValue({ success: true as const, session: mockSession })
    const adapter = makeAdapter({ signIn })
    render(<LoginForm adapter={adapter} onSuccess={onSuccess} />)
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'ok@example.com')
    const pwdInput = screen.getAllByLabelText(/^password$/i)[0]
    if (!pwdInput) throw new Error('Password input not found')
    await user.type(pwdInput, 'pass')
    const buttons = screen.getAllByRole('button')
    const submit = buttons.find((b) => b.getAttribute('type') === 'submit')
    if (submit) await user.click(submit)
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockSession)
    })
  })

  it('password toggle changes input type password to text', async () => {
    const user = userEvent.setup()
    const adapter = makeAdapter()
    render(<LoginForm adapter={adapter} />)
    const passwordInput = screen.getAllByLabelText(/^password$/i)[0]
    if (!passwordInput) throw new Error('Password input not found')
    expect(passwordInput).toHaveAttribute('type', 'password')
    const toggle = screen.getByRole('button', { name: /show password/i })
    await user.click(toggle)
    await waitFor(() => {
      expect(passwordInput).toHaveAttribute('type', 'text')
    })
    await user.click(screen.getByRole('button', { name: /hide password/i }))
    await waitFor(() => {
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })
})
