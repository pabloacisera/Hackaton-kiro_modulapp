/**
 * TASK-complaint-2: Complaint domain entity with state machine.
 *
 * State machine:
 *   received → under_review
 *   under_review → refund_approved | resolved_other_way | rejected
 *
 * Terminal states: refund_approved, resolved_other_way, rejected
 */

export type ComplaintReferenceType = 'order' | 'quote' | 'unknown';

export type ComplaintStatus =
  'received' | 'under_review' | 'refund_approved' | 'resolved_other_way' | 'rejected';

export interface ComplaintProps {
  id: string;
  referenceType: ComplaintReferenceType;
  referenceId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  reason: string;
  status: ComplaintStatus;
  resolutionNotes: string | null;
  refundRequestId: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  received: ['under_review'],
  under_review: ['refund_approved', 'resolved_other_way', 'rejected'],
  refund_approved: [],
  resolved_other_way: [],
  rejected: [],
};

export class Complaint {
  readonly id: string;
  readonly referenceType: ComplaintReferenceType;
  readonly referenceId: string | null;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly customerPhone: string | null;
  readonly reason: string;
  readonly status: ComplaintStatus;
  readonly resolutionNotes: string | null;
  readonly refundRequestId: string | null;
  readonly createdAt: Date;
  readonly resolvedAt: Date | null;

  constructor(props: ComplaintProps) {
    Object.assign(this, props);
  }

  private transition(next: ComplaintStatus, patch: Partial<ComplaintProps> = {}): Complaint {
    const allowed = ALLOWED_TRANSITIONS[this.status];
    if (!allowed.includes(next)) {
      throw new Error(
        `Invalid transition: ${this.status} → ${next}. Allowed: [${allowed.join(', ')}]`,
      );
    }
    return new Complaint({
      ...this.toProps(),
      ...patch,
      status: next,
    });
  }

  markUnderReview(): Complaint {
    return this.transition('under_review');
  }

  approveRefund(refundRequestId: string): Complaint {
    if (this.referenceType === 'unknown' || !this.referenceId) {
      throw new Error(
        'Cannot approve refund: no valid payment reference. Use "resolve" with a non-refund resolution instead.',
      );
    }
    if (!refundRequestId) {
      throw new Error('Refund request ID is required for idempotency');
    }
    return this.transition('refund_approved', {
      refundRequestId,
      resolvedAt: new Date(),
    });
  }

  resolve(notes: string, status: 'resolved_other_way' | 'rejected'): Complaint {
    if (!notes || notes.trim().length === 0) {
      throw new Error('Resolution notes are required');
    }
    return this.transition(status, {
      resolutionNotes: notes.trim(),
      resolvedAt: new Date(),
    });
  }

  static create(
    referenceType: ComplaintReferenceType,
    referenceId: string | null,
    customerName: string,
    customerEmail: string,
    customerPhone: string | null,
    reason: string,
  ): Complaint {
    if (!customerName || customerName.trim().length === 0) {
      throw new Error('Customer name is required');
    }
    if (!customerEmail || !customerEmail.includes('@')) {
      throw new Error('Valid customer email is required');
    }
    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required');
    }

    return new Complaint({
      id: crypto.randomUUID(),
      referenceType,
      referenceId: referenceId || null,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone?.trim() || null,
      reason: reason.trim(),
      status: 'received',
      resolutionNotes: null,
      refundRequestId: null,
      createdAt: new Date(),
      resolvedAt: null,
    });
  }

  toProps(): ComplaintProps {
    return {
      id: this.id,
      referenceType: this.referenceType,
      referenceId: this.referenceId,
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      customerPhone: this.customerPhone,
      reason: this.reason,
      status: this.status,
      resolutionNotes: this.resolutionNotes,
      refundRequestId: this.refundRequestId,
      createdAt: this.createdAt,
      resolvedAt: this.resolvedAt,
    };
  }
}
