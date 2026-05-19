import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PublisherBadge from './PublisherBadge';

describe('PublisherBadge', () => {
  it('renders publisher name', () => {
    render(<PublisherBadge publisher="Microsoft" layer="Microsoft" />);
    expect(screen.getByTestId('publisher-badge')).toHaveTextContent('Microsoft');
  });

  it('shows ⬡ icon for Microsoft layer', () => {
    render(<PublisherBadge publisher="Microsoft" layer="Microsoft" />);
    expect(screen.getByTestId('publisher-badge')).toHaveTextContent('⬡');
  });

  it('shows ◈ icon for Partner layer', () => {
    render(<PublisherBadge publisher="Velocity" layer="Partner" />);
    expect(screen.getByTestId('publisher-badge')).toHaveTextContent('◈');
  });

  it('shows ◇ icon for Customer layer', () => {
    render(<PublisherBadge publisher="Blank" layer="Customer" />);
    expect(screen.getByTestId('publisher-badge')).toHaveTextContent('◇');
  });

  it('uses blue color for Microsoft', () => {
    render(<PublisherBadge publisher="Microsoft" layer="Microsoft" />);
    const badge = screen.getByTestId('publisher-badge');
    expect(badge.style.color).toBe('rgb(0, 122, 255)');
  });

  it('uses green color for Partner', () => {
    render(<PublisherBadge publisher="Velocity" layer="Partner" />);
    const badge = screen.getByTestId('publisher-badge');
    expect(badge.style.color).toBe('rgb(48, 209, 88)');
  });

  it('uses gray color for Customer', () => {
    render(<PublisherBadge publisher="Blank" layer="Customer" />);
    const badge = screen.getByTestId('publisher-badge');
    expect(badge.style.color).toBe('rgb(142, 142, 147)');
  });
});
