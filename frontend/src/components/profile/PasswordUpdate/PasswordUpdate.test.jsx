import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PasswordUpdate from './PasswordUpdate';

describe('PasswordUpdate Component Module', () => {
  const mockOnChange = vi.fn();
  const baseValues = { currentPassword: '', newPassword: '', confirmPassword: '' };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnChange.mockClear();
  });

  it('renders all three standard password fields securely masked', () => {
    render(<PasswordUpdate values={baseValues} onChange={mockOnChange} />);

    // FIXED: Use exact regex boundaries to separate matching loops cleanly
    expect(screen.getByLabelText(/^current password$/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/^new password$/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/^confirm new password$/i)).toHaveAttribute('type', 'password');
  });

  it('routes input keystrokes cleanly to the unified state handle modifier', () => {
    render(<PasswordUpdate values={baseValues} onChange={mockOnChange} />);

    const currentInput = screen.getByLabelText(/^current password$/i);
    fireEvent.change(currentInput, { target: { value: 'old-password-123' } });
    expect(mockOnChange).toHaveBeenCalledWith('currentPassword', 'old-password-123');

    // FIXED: Use explicit anchor matchers to target the unique input node field
    const newInput = screen.getByLabelText(/^new password$/i);
    fireEvent.change(newInput, { target: { value: 'fresh-secret-key' } });
    expect(mockOnChange).toHaveBeenCalledWith('newPassword', 'fresh-secret-key');
  });
});
