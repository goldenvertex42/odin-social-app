import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router';
import Sidebar from './Sidebar';

describe('Sidebar Component Module', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
  });

  afterEach(() => {
    cleanup(); // Clear JSDOM memory tree completely
  });

  it('renders required system link targets correctly', () => {
    const feedLink = screen.getByRole('link', { name: /social feed/i });
    const exploreLink = screen.getByRole('link', { name: /discover users/i });

    expect(feedLink).toBeInTheDocument();
    expect(feedLink).toHaveAttribute('href', '/feed');
    
    expect(exploreLink).toBeInTheDocument();
    expect(exploreLink).toHaveAttribute('href', '/explore');
  });

  it('contains proper structural landmarks for non-visual screens', () => {
    expect(screen.getByRole('navigation', { name: /main application navigation/i })).toBeInTheDocument();
  });
});
