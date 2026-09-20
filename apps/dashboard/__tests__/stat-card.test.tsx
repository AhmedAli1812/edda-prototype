import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatCard } from '../src/components/ui/StatCard';
import { StatusBadge } from '../src/components/ui/StatusBadge';

describe('Dashboard UI Components', () => {
  it('renders StatCard with title and formatted value', () => {
    render(
      <StatCard
        title="إجمالي العمليات"
        value="84,620 ج.م"
        change="+12.4%"
        isPositive={true}
      />,
    );

    expect(screen.getByText('إجمالي العمليات')).toBeInTheDocument();
    expect(screen.getByText('84,620 ج.م')).toBeInTheDocument();
    expect(screen.getByText('+12.4%')).toBeInTheDocument();
  });

  it('renders StatusBadge with correct variant styling', () => {
    render(<StatusBadge label="الفني في الطريق" variant="green" />);
    const badge = screen.getByText('الفني في الطريق');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-green');
  });
});
