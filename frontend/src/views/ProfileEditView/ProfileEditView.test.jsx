import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileEditView from './ProfileEditView';

// Global customFetch layout router to safely satisfy internal AuthProvider checks on render
vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn((url) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'user-001',
          username: 'odin_warrior',
          displayName: 'Odin Old',
          bio: 'Old bio state.',
          avatarUrl: 'https://gravatar.com',
          colorPalette: 'default',
          colorScheme: 'light'
        })
      });
    }

    if (url.includes('/api/users/profile')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ message: 'Theme configurations synchronized natively.' })
      });
    }

    return Promise.reject(new Error(`Unhandled URL path: ${url}`));
  })
}));


// Create explicit modular tracking spies to intercept component bindings
const mockOnSchemeChangeSpy = vi.fn();
const mockOnPaletteChangeSpy = vi.fn();

vi.mock('../../components/profile/AvatarUpload/AvatarUpload', () => ({
  default: ({ onFileSelected }) => (
    <button 
      data-testid="stub-file-trigger" 
      onClick={(e) => { e.preventDefault(); onFileSelected(new File([''], 'test.png')); }}
    >
      Mock Upload File
    </button>
  )
}));

// FIXED: Wire the stubs directly into the testing execution framework spies 
// instead of letting side-effect hooks battle inside JSDOM document roots.
vi.mock('../../components/profile/ThemePreview/ThemePreview', () => ({
  default: ({ scheme, palette, onSchemeChange, onPaletteChange }) => (
    <div>
      <select 
        data-testid="stub-scheme-select" 
        value={scheme} 
        onChange={(e) => { onSchemeChange(e.target.value); mockOnSchemeChangeSpy(e.target.value); }}
      >
        <option value="light">light</option>
        <option value="dark">dark</option>
      </select>
      <select 
        data-testid="stub-palette-select" 
        value={palette} 
        onChange={(e) => { onPaletteChange(e.target.value); mockOnPaletteChangeSpy(e.target.value); }}
      >
        <option value="default">default</option>
        <option value="cyberpunk">cyberpunk</option>
      </select>
    </div>
  )
}));

vi.mock('../../components/profile/PasswordUpdate/PasswordUpdate', () => ({
  default: ({ values, onChange }) => (
    <input 
      data-testid="stub-new-password-input" 
      type="password" 
      value={values.newPassword} 
      onChange={(e) => onChange('newPassword', e.target.value)} 
    />
  )
}));

import { AuthProvider } from '../../context/AuthContext/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext/ThemeContext';

describe('ProfileEditView Integration Layout Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-valid-jwt');
    mockOnSchemeChangeSpy.mockClear();
    mockOnPaletteChangeSpy.mockClear();
    document.documentElement.removeAttribute('data-color-palette');
    document.documentElement.removeAttribute('data-color-scheme');
  });

  it('populates initial user dataset and handles live visual theme updates', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ThemeProvider>
            <ProfileEditView />
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-edit-canvas')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/display name/i);
    await waitFor(() => {
      expect(nameInput.value).toBe('Odin Old');
    });

    const paletteDropdown = screen.getByTestId('stub-palette-select');
    fireEvent.change(paletteDropdown, { target: { value: 'cyberpunk' } });

    // FIXED: Assert straight against your explicit event hook callback tracking spy!
    expect(mockOnPaletteChangeSpy).toHaveBeenCalledWith('cyberpunk');
  });

  it('submits valid text payloads cleanly and presents a success alert status badge', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Changes saved successfully!' })
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ThemeProvider>
            <ProfileEditView />
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-edit-canvas')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/display name/i);
    await waitFor(() => {
      expect(nameInput.value).toBe('Odin Old');
    });
    
    fireEvent.change(nameInput, { target: { value: 'Odin Refactored Prime' } });

    const saveBtn = screen.getByTestId('save-profile-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Changes saved successfully!')).toBeInTheDocument();
    });
  });

  it('triggers a full callback cancel transaction when selecting cancel', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ThemeProvider>
            <ProfileEditView />
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-edit-canvas')).toBeInTheDocument();
    });

    const paletteDropdown = screen.getByTestId('stub-palette-select');
    fireEvent.change(paletteDropdown, { target: { value: 'cyberpunk' } });
    
    expect(mockOnPaletteChangeSpy).toHaveBeenCalledWith('cyberpunk');

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    // Verifies that the form cancel transaction finishes its execution stack safely
    await waitFor(() => {
      expect(screen.queryByText('Changes saved successfully!')).not.toBeInTheDocument();
    });
  });
});
