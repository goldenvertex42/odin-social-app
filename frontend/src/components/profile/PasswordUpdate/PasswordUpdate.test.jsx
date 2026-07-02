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
    
    const currentField = screen.getByLabelText(/^current password$/i);
    const newField = screen.getByLabelText(/^new password$/i);
    const confirmField = screen.getByLabelText(/^confirm new password$/i);

    expect(currentField).toHaveAttribute('type', 'password');
    expect(newField).toHaveAttribute('type', 'password');
    expect(confirmField).toHaveAttribute('type', 'password');

    expect(currentField).toHaveAttribute('aria-describedby', 'password-optional-hint');
    expect(newField).toHaveAttribute('aria-describedby', 'password-optional-hint');
    expect(confirmField).toHaveAttribute('aria-describedby', 'password-optional-hint');
  });

  it('routes input keystrokes cleanly to the unified state handle modifier', () => {
    render(<PasswordUpdate values={baseValues} onChange={mockOnChange} />);
    
    const currentInput = screen.getByLabelText(/^current password$/i);
    fireEvent.change(currentInput, { target: { value: 'old-password-123' } });
    expect(mockOnChange).toHaveBeenCalledWith('currentPassword', 'old-password-123');

    const newInput = screen.getByLabelText(/^new password$/i);
    fireEvent.change(newInput, { target: { value: 'fresh-secret-key' } });
    expect(mockOnChange).toHaveBeenCalledWith('newPassword', 'fresh-secret-key');
  });
});
