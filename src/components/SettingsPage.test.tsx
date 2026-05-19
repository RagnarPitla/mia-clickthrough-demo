import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsPage from './SettingsPage';

describe('SettingsPage', () => {
  beforeEach(() => localStorage.clear());

  it('renders all settings sections', () => {
    render(<SettingsPage bgImage="" onBgImageChange={vi.fn()} />);
    expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    expect(screen.getByText('Background Image')).toBeInTheDocument();
    expect(screen.getByText('Polling Interval')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Autopilot')).toBeInTheDocument();
  });

  it('persists polling interval to localStorage', () => {
    render(<SettingsPage bgImage="" onBgImageChange={vi.fn()} />);
    fireEvent.click(screen.getByTestId('polling-30000'));
    expect(localStorage.getItem('kazuki-polling')).toBe('30000');
  });

  it('toggles notifications and persists', () => {
    render(<SettingsPage bgImage="" onBgImageChange={vi.fn()} />);
    const toggle = screen.getByTestId('toggle-notifications');
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(toggle);
    expect(localStorage.getItem('kazuki-notifications')).toBe('false');
  });

  it('toggles autopilot and persists', () => {
    render(<SettingsPage bgImage="" onBgImageChange={vi.fn()} />);
    const toggle = screen.getByTestId('toggle-autopilot');
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    expect(localStorage.getItem('kazuki-autopilot')).toBe('true');
  });

  it('loads persisted values on mount', () => {
    localStorage.setItem('kazuki-polling', '5000');
    localStorage.setItem('kazuki-notifications', 'false');
    localStorage.setItem('kazuki-autopilot', 'true');

    render(<SettingsPage bgImage="" onBgImageChange={vi.fn()} />);
    expect(screen.getByTestId('toggle-notifications').getAttribute('aria-checked')).toBe('false');
    expect(screen.getByTestId('toggle-autopilot').getAttribute('aria-checked')).toBe('true');
  });
});
