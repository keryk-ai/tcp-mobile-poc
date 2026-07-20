// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import PaymentSheet from './PaymentSheet';
import type { DemoSite } from '@/lib/demoData';

afterEach(cleanup);

const site = { id: 'demo-completed-001', documentId: 'INV-2847', total: 3267.0 } as DemoSite;

describe('PaymentSheet', () => {
  it('renders Visa •••• 4242 preselected', () => {
    render(<PaymentSheet site={site} onClose={vi.fn()} />);
    expect(screen.getByText(/Visa •••• 4242/)).toBeInTheDocument();
  });

  it('shows "Payment submitted" and the simulated disclaimer after paying', () => {
    render(<PaymentSheet site={site} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Pay \$3,267\.00/ }));
    expect(screen.getByText('Payment submitted')).toBeInTheDocument();
    expect(screen.getByText('(Simulated — no charge was made.)')).toBeInTheDocument();
  });
});
