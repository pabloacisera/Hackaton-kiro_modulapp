/**
 * TASK-queue-1: Queue name constants and job name constants.
 */

// ── Queue names ──────────────────────────────────────────────────────────────
export const QUEUE_SCHEDULED_JOBS = 'scheduled-jobs';
export const QUEUE_PAYMENT_WEBHOOK = 'payment-webhook';
export const QUEUE_EMAIL_SEND = 'email-send';

// ── Job names (scheduled-jobs queue) ─────────────────────────────────────────
export const JOB_QUOTE_EXPIRATION_CHECK = 'quote-expiration-check';
export const JOB_QUOTE_PAYMENT_EXPIRATION_CHECK = 'quote-payment-expiration-check';
export const JOB_PAYMENT_RECONCILIATION = 'payment-reconciliation';
export const JOB_LOW_STOCK_CHECK = 'low-stock-check';

// ── Job names (event-driven queues) ──────────────────────────────────────────
export const JOB_PROCESS_PAYMENT_RESULT = 'process-payment-result';
export const JOB_SEND_EMAIL = 'send-email';

// ── Default job options ──────────────────────────────────────────────────────
export const DEFAULT_RETRY_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000, // 1s → 4s → 16s
  },
};
