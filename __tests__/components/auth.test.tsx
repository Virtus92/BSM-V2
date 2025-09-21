import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { LoginForm } from '@/components/login-form'
import { SignUpForm } from '@/components/sign-up-form'
import { AuthButtonClient as AuthButton } from '@/components/auth-button-client'

// Mock Supabase client
const mockAuth = {
  getUser: jest.fn(),
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn()
}

const mockSupabase = {
  auth: mockAuth
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn()
  })
}))

describe('Authentication Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('LoginForm', () => {
    it('should render login form correctly', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should validate email format', async () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })

    it('should handle successful login', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null
      })

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })
    })

    it('should handle login error', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' }
      })

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })

    it('should show loading state during submission', async () => {
      mockAuth.signInWithPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { user: null }, error: null }), 100))
      )

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
    })
  })

  describe('SignUpForm', () => {
    it('should render signup form correctly', () => {
      render(<SignUpForm />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })

    it('should validate password requirements', async () => {
      render(<SignUpForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign up/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
      })
    })

    it('should handle successful signup', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: { id: '123', email: 'newuser@example.com' } },
        error: null
      })

      render(<SignUpForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign up/i })

      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAuth.signUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'password123'
        })
      })
    })

    it('should handle signup error', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already registered' }
      })

      render(<SignUpForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign up/i })

      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email already registered/i)).toBeInTheDocument()
      })
    })
  })

  describe('AuthButton', () => {
    it('should show sign in button when not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      render(<AuthButton />)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
      })
    })

    it('should show user menu when authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'user@example.com',
            user_metadata: { full_name: 'Test User' }
          }
        },
        error: null
      })

      render(<AuthButton />)

      await waitFor(() => {
        expect(screen.getByText(/test user/i)).toBeInTheDocument()
      })
    })

    it('should handle sign out', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'user@example.com',
            user_metadata: { full_name: 'Test User' }
          }
        },
        error: null
      })

      mockAuth.signOut.mockResolvedValue({ error: null })

      render(<AuthButton />)

      await waitFor(() => {
        const signOutButton = screen.getByRole('button', { name: /sign out/i })
        fireEvent.click(signOutButton)
      })

      await waitFor(() => {
        expect(mockAuth.signOut).toHaveBeenCalled()
      })
    })
  })

  describe('Authentication Flow Integration', () => {
    it('should redirect after successful login', async () => {
      const mockPush = jest.fn()

      jest.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        refresh: jest.fn()
      })

      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null
      })

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should handle authentication state persistence', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'user@example.com',
            user_metadata: { full_name: 'Test User' }
          }
        },
        error: null
      })

      const { rerender } = render(<AuthButton />)

      await waitFor(() => {
        expect(screen.getByText(/test user/i)).toBeInTheDocument()
      })

      // Simulate app reload
      rerender(<AuthButton />)

      await waitFor(() => {
        expect(screen.getByText(/test user/i)).toBeInTheDocument()
      })
    })

    it('should handle session expiration', async () => {
      // First call returns user (authenticated)
      mockAuth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: '123',
            email: 'user@example.com'
          }
        },
        error: null
      })

      // Second call returns no user (session expired)
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'JWT expired' }
      })

      const { rerender } = render(<AuthButton />)

      await waitFor(() => {
        expect(screen.getByText(/user@example.com/i)).toBeInTheDocument()
      })

      // Simulate session check
      rerender(<AuthButton />)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
      })
    })
  })

  describe('Security Tests', () => {
    it('should not expose sensitive data in error messages', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' }
      })

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByText(/invalid login credentials/i)
        expect(errorMessage.textContent).not.toContain('database')
        expect(errorMessage.textContent).not.toContain('sql')
        expect(errorMessage.textContent).not.toContain('internal')
      })
    })

    it('should clear form data on unmount', () => {
      const { unmount } = render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      expect(emailInput.value).toBe('test@example.com')
      expect(passwordInput.value).toBe('password123')

      unmount()

      // Form should not retain data after unmount
      const { container } = render(<LoginForm />)
      const newEmailInput = container.querySelector('input[type="email"]') as HTMLInputElement
      const newPasswordInput = container.querySelector('input[type="password"]') as HTMLInputElement

      expect(newEmailInput.value).toBe('')
      expect(newPasswordInput.value).toBe('')
    })
  })
})