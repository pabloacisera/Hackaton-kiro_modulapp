package com.modula.payment.service;

import com.modula.payment.config.Audited;
import com.modula.payment.domain.Payment;
import com.modula.payment.domain.Payment.PaymentOrigin;
import com.modula.payment.domain.Payment.PaymentStatus;
import com.modula.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Optional;

/**
 * Initiates payments via PayPal with idempotency guarantee.
 *
 * <p>TASK-pay-6: POST /payments/orders
 * Idempotency: if a {@link Payment} with the same {@code idempotencyKey} already
 * exists, return the existing record without calling PayPal again.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PayPalClient payPalClient;

    /**
     * Initiates a new payment or returns an existing one (idempotent).
     *
     * @param referenceId    order or quote id from api-core
     * @param origin         'order' or 'quote'
     * @param amountUsd      payment amount in USD
     * @param customerEmail  customer email
     * @param idempotencyKey unique key per business attempt
     * @return {@link PaymentInitResult} with payment_link and internal ref
     */
    @Transactional
    @Audited(action = "INITIATE_PAYMENT", actor = "api-core")
    public PaymentInitResult initiatePayment(String referenceId,
                                              PaymentOrigin origin,
                                              BigDecimal amountUsd,
                                              String customerEmail,
                                              String idempotencyKey) {
        // ── Idempotency check ────────────────────────────────────────────────
        Optional<Payment> existing = paymentRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            Payment p = existing.get();
            log.info("Idempotent return for key={}, paypalOrderId={}", idempotencyKey, p.getPaypalOrderId());
            String approvalUrl = buildApprovalUrl(p.getPaypalOrderId());
            return new PaymentInitResult(approvalUrl, p.getId().toString(), false);
        }

        // ── Create order in PayPal ───────────────────────────────────────────
        PayPalClient.PayPalOrderResult order =
                payPalClient.createOrder(amountUsd, referenceId, customerEmail);

        // ── Persist Payment(initiated) ───────────────────────────────────────
        Payment payment = new Payment();
        payment.setReferenceId(referenceId);
        payment.setOrigin(origin);
        payment.setAmountUsd(amountUsd);
        payment.setStatus(PaymentStatus.initiated);
        payment.setPaypalOrderId(order.orderId());
        payment.setIdempotencyKey(idempotencyKey);
        payment.setCustomerEmail(customerEmail);
        payment.setCreatedAt(OffsetDateTime.now());
        Payment saved = paymentRepository.save(payment);

        return new PaymentInitResult(order.approvalUrl(), saved.getId().toString(), true);
    }

    /**
     * Marks a payment as CONFIRMED. Called by WebhookService after PayPal webhook validation.
     */
    @Transactional
    public Payment confirmPayment(String paypalOrderId) {
        Payment payment = paymentRepository.findByPaypalOrderId(paypalOrderId)
                .orElseThrow(() -> new IllegalStateException(
                        "No payment found for paypalOrderId=" + paypalOrderId));
        payment.setStatus(PaymentStatus.confirmed);
        payment.setConfirmedAt(OffsetDateTime.now());
        return paymentRepository.save(payment);
    }

    /**
     * Marks a payment as FAILED.
     */
    @Transactional
    public Payment failPayment(String paypalOrderId) {
        Payment payment = paymentRepository.findByPaypalOrderId(paypalOrderId)
                .orElseThrow(() -> new IllegalStateException(
                        "No payment found for paypalOrderId=" + paypalOrderId));
        payment.setStatus(PaymentStatus.failed);
        return paymentRepository.save(payment);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String buildApprovalUrl(String paypalOrderId) {
        // For existing payments, reconstruct the approval URL from paypal order id.
        // In a real flow the caller would re-initiate with PayPal to get a fresh link
        // if the previous one expired. Simplified here.
        return "https://www.paypal.com/checkoutnow?token=" + paypalOrderId;
    }

    // ── Result types ─────────────────────────────────────────────────────────

    public record PaymentInitResult(String paymentLink,
                                    String paymentServiceRef,
                                    boolean created) {}
}
