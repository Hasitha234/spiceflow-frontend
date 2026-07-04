import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AuditTimeline, AuditTimelineItem } from '../AuditTimeline';

describe('AuditTimeline Component', () => {
  it('renders empty state when no items are provided', () => {
    render(<AuditTimeline items={[]} />);
    expect(screen.getByText('No audit history recorded')).toBeDefined();
  });

  it('renders timeline items with actor, action, states, correlation ID, and comment', () => {
    const items: AuditTimelineItem[] = [
      {
        id: 1,
        timestamp: '2026-07-04T10:00:00Z',
        actor: 'Admin User',
        action: 'SubmitPO',
        fromState: 'DRAFT',
        toState: 'SUBMITTED',
        correlationId: 'PO-2026-0001',
        comment: 'Submitting PO for manager approval',
      },
    ];

    render(<AuditTimeline items={items} title="PO History" />);

    expect(screen.getByText('PO History')).toBeDefined();
    expect(screen.getByText('SubmitPO')).toBeDefined();
    expect(screen.getByText('DRAFT')).toBeDefined();
    expect(screen.getByText('SUBMITTED')).toBeDefined();
    expect(screen.getByText('PO-2026-0001')).toBeDefined();
    expect(screen.getByText('Admin User')).toBeDefined();
    expect(screen.getByText(/Submitting PO for manager approval/)).toBeDefined();
  });
});
