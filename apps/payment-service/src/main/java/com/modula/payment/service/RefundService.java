package com.modula.payment.service;

import com.modula.payment.config.Audited;
import com.modula.payment.domain.Payment;
import com.modula.payment.domain.Payment.PaymentStatus;
import com.modula.payment.domain.Refund;
import com.modula.payment.domain.Refund.RefundStatus;
import com.modula.payment.repository.PaymentRepository;
import com.modula.payment.repository.RefundRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Optional;

/**
 * TASK-pay-12: Refund service with idempotency.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefundService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final PayPalRefundClient payPalRefundClient;

    /**
     * Executes a refund for the payment identified by {@code referenceId}.
     * Idempotent: same {@code refundRequestId} returns the existing refund.
     */
    @Transactional
    @Audited(action = "EXECUTE_REFUND", actor = "api-core")
    public Refund refund(String referenceId,
                         String reason,
                         String refundRequestId) {

        // ── Idempotency ──────────────────────────────────────────────────────
        Optional<Refund> existing = refundRepository.findByRefundRequestId(refundRequestId);
        if (existing.isPresent()) {
            log.info("Idempotent refund return for refundRequestId={}", refundRequestId);
            return existing.get();
        }

        // ── Locate confirmed payment ─────────────────────────────────────────
        Payment payment = paymentRepository.findByReferenceId(referenceId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Payment not found for reference: " + referenceId));

        if (payment.getStatus() != PaymentStatus.confirmed) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Cannot refund a payment in status: " + payment.getStatus());
        }

        // ── Call PayPal Refunds API ──────────────────────────────────────────
        BigDecimal amount = payment.getAmountUsd();
        PayPalRefundClient.RefundResult result =
                payPalRefundClient.refund(payment.getPaypalOrderId(), amount);

        // ── Persist Refund ───────────────────────────────────────────────────
        Refund refund = new Refund();
        refund.setPayment(payment);
        refund.setRefundRequestId(refundRequestId);
        refund.setPaypalRefundId(result.refundId());
        refund.setReason(reason);
        refund.setStatus("COMPLETED".equalsIgnoreCase(result.status())
                ? RefundStatus.processed : RefundStatus.failed);
        refund.setCreatedAt(OffsetDateTime.now());
        Refund saved = refundRepository.save(refund);

        // ── Update payment status ────────────────────────────────────────────
        payment.setStatus(PaymentStatus.refunded);
        paymentRepository.save(payment);

        return saved;
    }
}
