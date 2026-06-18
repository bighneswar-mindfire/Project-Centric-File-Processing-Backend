import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';
import { Signup } from '../pages/Signup';

vi.mock('../services/authService', () => ({
  authService: {
    signup: vi.fn(),
  },
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>,
  );
};

describe('Signup Component', () => {
  it('should display an error if password mismatch occurs', async () => {
    renderWithProviders(<Signup />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    //different passwords
    fireEventChange(emailInput, 'vigbi@abc.com');
    fireEventChange(passwordInput, 'qwerty');
    fireEventChange(confirmPasswordInput, 'qqqqqq');

    fireEvent.submit(submitButton);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('do not match');
  });

  it('should display an error if password is under 6 characters', async () => {
    renderWithProviders(<Signup />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    //less than 6 char password
    fireEventChange(emailInput, 'vigbi@xyz.com');
    fireEventChange(passwordInput, '12345');
    fireEventChange(confirmPasswordInput, '12345');

    fireEvent.submit(submitButton);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('at least 6 characters');
  });
});

// clean up
function fireEventChange(element: HTMLElement, value: string) {
  fireEvent.change(element, { target: { value } });
}
