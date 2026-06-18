import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';
import { Login } from '../pages/Login';
import { authService } from '../services/authService';

//API mock
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
  },
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>,
  );
};

describe('Login Component', () => {
  it('should render the login form inputs and button', () => {
    renderWithProviders(<Login />);

    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should display an error alert if submitted with empty fields', async () => {
    renderWithProviders(<Login />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/please fill in all fields/i);
  });

  it('should submit form and trigger login', async () => {
    //mock login response
    const mockLoginResponse = {
      token: 'mock-jwt-token',
      user: { email: 'vigbi@abc.com' },
    };
    vi.mocked(authService.login).mockResolvedValueOnce(mockLoginResponse);

    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    //credentials
    fireEvent.change(emailInput, { target: { value: 'vigbi@abc.com' } });
    fireEvent.change(passwordInput, { target: { value: 'qwerty' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('vigbi@abc.com', 'qwerty');
    });
  });
});
