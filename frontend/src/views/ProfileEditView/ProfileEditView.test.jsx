import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileEditView from './ProfileEditView';

let mockActiveUserContext = {
  id: 'user-001',
  username: 'odin_warrior',
  displayName: 'Odin Old',
  bio: 'Old bio state.',
  avatarUrl: 'https://gravatar.com',
  colorPalette: 'default',
  colorScheme: 'light',
  isGuest: false
};

vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn((url, options = {}) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({
        ok: true,
        json: async () => mockActiveUserContext
      });
    }
    if (url.includes('/api/users/profile')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ message: 'Changes saved successfully!', user: mockActiveUserContext })
      });
    }
    return Promise.reject(new Error(`Unhandled URL path: ${url}`));
  })
}));
import { customFetch } from '../../utils/api/api';

const mockOnSchemeChangeSpy = vi.fn();
const mockOnPaletteChangeSpy = vi.fn();

vi.mock('../../components/profile/AvatarUpload/AvatarUpload', () => ({
  default: ({ onFileSelected }) => (
    <button
      data-testid="stub-file-trigger"
      onClick={(e) => {
        e.preventDefault();
        onFileSelected(new File([''], 'test.png'));
      }}
    >
      Mock Upload File
    </button>
  )
}));

vi.mock('../../components/profile/ThemePreview/ThemePreview', () => ({
  default: ({ scheme, palette, onSchemeChange, onPaletteChange }) => (
    <div>
      <select
        data-testid="stub-scheme-select"
        value={scheme}
        onChange={(e) => {
          onSchemeChange(e.target.value);
          mockOnSchemeChangeSpy(e.target.value);
        }}
      >
        <option value="light">light</option>
        <option value="dark">dark</option>
      </select>
      <select
        data-testid="stub-palette-select"
        value={palette}
        onChange={(e) => {
          onPaletteChange(e.target.value);
          mockOnPaletteChangeSpy(e.target.value);
        }}
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
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-valid-jwt');
    mockOnSchemeChangeSpy.mockClear();
    mockOnPaletteChangeSpy.mockClear();
    document.documentElement.removeAttribute('data-color-palette');
    document.documentElement.removeAttribute('data-color-scheme');

    // Reset default user details context
    mockActiveUserContext = {
      id: 'user-001',
      username: 'odin_warrior',
      displayName: 'Odin Old',
      bio: 'Old bio state.',
      avatarUrl: 'https://gravatar.com',
      colorPalette: 'default',
      colorScheme: 'light',
      isGuest: false
    };
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
    expect(mockOnPaletteChangeSpy).toHaveBeenCalledWith('cyberpunk');
  });

  it('submits valid text payloads cleanly and presents a success alert status badge', async () => {
    // Aligned: Track submission executions securely using your verified customFetch spy layer
    vi.mocked(customFetch).mockImplementation((url, options) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: async () => mockActiveUserContext });
      }
      if (url.includes('/api/users/profile') && options.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Changes saved successfully!', user: mockActiveUserContext })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
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

    await waitFor(() => {
      expect(screen.queryByText('Changes saved successfully!')).not.toBeInTheDocument();
    });
  });

  it('mounts the Danger Zone panel container if the active user node is a standard account', async () => {
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
      expect(screen.getByTestId('danger-zone-panel')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
  });

  it('completely hides and unmounts the Danger Zone section if the active user is a recruiter guest profile', async () => {
    mockActiveUserContext.isGuest = true;

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

    expect(screen.queryByTestId('danger-zone-panel')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete account/i })).not.toBeInTheDocument();
  });
});
