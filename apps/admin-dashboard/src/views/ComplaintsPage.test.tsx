import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComplaintsPage } from './ComplaintsPage';

vi.mock('../controllers/useComplaints', () => ({ useComplaints: vi.fn() }));

import { useComplaints } from '../controllers/useComplaints';
const mockUseComplaints = vi.mocked(useComplaints);

const baseHook = {
  complaints: [],
  total: 0,
  loading: false,
  error: null,
  statusFilter: undefined,
  setStatusFilter: vi.fn(),
  review: vi.fn(),
  refund: vi.fn(),
  resolve: vi.fn(),
  reviewModalComplaint: null,
  openReviewModal: vi.fn(),
  closeReviewModal: vi.fn(),
  resolveModalComplaint: null,
  openResolveModal: vi.fn(),
  closeResolveModal: vi.fn(),
  reload: vi.fn(),
  page: 1,
  search: '',
  setSearch: vi.fn(),
  setPage: vi.fn(),
};

const receivedComplaint = {
  id: 'c-1',
  referenceType: 'order' as const,
  referenceId: 'ord-123',
  customerName: 'Ana García',
  customerEmail: 'ana@test.com',
  customerPhone: null,
  reason: 'Product arrived damaged',
  status: 'received' as const,
  resolutionNotes: null,
  refundRequestId: null,
  createdAt: '2026-07-23T10:00:00Z',
  resolvedAt: null,
};

describe('ComplaintsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders complaints table', () => {
    mockUseComplaints.mockReturnValue({ ...baseHook, complaints: [receivedComplaint], total: 1 });
    render(<ComplaintsPage />);
    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText(/product arrived damaged/i)).toBeInTheDocument();
  });

  it('shows Revisar button for received complaints', () => {
    mockUseComplaints.mockReturnValue({ ...baseHook, complaints: [receivedComplaint], total: 1 });
    render(<ComplaintsPage />);
    expect(screen.getByRole('button', { name: /revisar/i })).toBeInTheDocument();
  });

  it('shows Aprobar reembolso and Resolver buttons for under_review', () => {
    const underReview = { ...receivedComplaint, status: 'under_review' as const };
    mockUseComplaints.mockReturnValue({ ...baseHook, complaints: [underReview], total: 1 });
    render(<ComplaintsPage />);
    expect(screen.getByRole('button', { name: /aprobar reembolso/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resolver/i })).toBeInTheDocument();
  });

  it('opens review modal on Revisar button click', () => {
    const mockOpenReview = vi.fn();
    mockUseComplaints.mockReturnValue({
      ...baseHook,
      complaints: [receivedComplaint],
      total: 1,
      openReviewModal: mockOpenReview,
    });
    render(<ComplaintsPage />);
    fireEvent.click(screen.getByRole('button', { name: /revisar/i }));
    expect(mockOpenReview).toHaveBeenCalledWith(receivedComplaint);
  });

  it('shows empty state', () => {
    mockUseComplaints.mockReturnValue(baseHook);
    render(<ComplaintsPage />);
    expect(screen.getByText(/no se encontraron reclamos/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseComplaints.mockReturnValue({ ...baseHook, error: 'Server error' });
    render(<ComplaintsPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Server error');
  });
});
