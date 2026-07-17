// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import TabBar from './TabBar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/inbox',
}));

afterEach(cleanup);

describe('TabBar', () => {
  it('renders four tabs with labels Home, Inbox, Apps, AI', () => {
    render(<TabBar />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByText('Apps')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('applies the active brand-orange color to the tab matching the current pathname', () => {
    render(<TabBar />);
    const inboxLink = screen.getByText('Inbox').closest('a');
    const homeLink = screen.getByText('Home').closest('a');
    expect(inboxLink).toHaveClass('text-[hsl(25,100%,50%)]');
    expect(homeLink).not.toHaveClass('text-[hsl(25,100%,50%)]');
  });
});
