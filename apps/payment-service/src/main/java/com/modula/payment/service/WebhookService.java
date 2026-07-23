package com.modula.payment.service;

import com.modula.payment.config.PayPalProperties;
import com.modula.payment.domain.Payment;
import com.modula.payment.domain.Receipt;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * TASK-pay-7: Processes incoming PayPal webhooks.
 *
 * <p>Deduplication: processed event IDs are stored in a concurrent set.
 * In production this should use Redis or a DB table — for now an in-process
 * set is sufficient for the hackathon scope.
 *
 * <p>Signature validation: checks the PayPal-Transmission-Sig header against
 * the configured webhook ID. Full SDK validation is replaced with a header
 * presence check here (sandbox); production must use PayPal SDK verify().
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookService {

    private final PaymentService paymentService;
    private final ReceiptService receiptService;
    private final EmailService emailService;
    private final ApiCoreWebhookClient apiCoreWebhookClient;
    private final PayPalProperties props;

    /** In-process deduplication store (replace with Redis in production). */
    private final Set<String> processedEventIds = ConcurrentHashMap.newKeySet();

    /**
     * Processes a PayPal webhook event.
     *
     * @param eventId          PayPal-Transmission-Id header value
     * @param transmissionSig  PayPal-Transmission-Sig header value (signature check)
     * @param eventType        event_type from webhook body
     * @param resourceBody     the "resource" object from PayPal webhook body
     */
    public void process(String eventId,
                         String transmissionSig,
                         String eventType,
                         Map<String, Object> resourceBody) {

        // ── Signature validation (simplified for sandbox) ─────────────────────
        if (transmissionSig == null || transmissionSig.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Missing PayPal webhook signature");
        }

        // ── Deduplication ─────────────────────────────────────────────────────
        if (!processedEventIds.add(eventId)) {
            log.info("Duplicate webhook eventId={} ignored", eventId);
            return; // already processed — idempotent 200
        }

        log.info("Processing webhook eventId={}, type={}", eventId, eventType);

        switch (eventType) {
            case "CHECKOUT.ORDER.APPROVED",
                 "PAYMENT.CAPTURE.COMPLETED" -> handlePaymentConfirmed(resourceBody);
            case "PAYMENT.CAPTURE.DENIED",
                 "PAYMENT.CAPTURE.DECLINED"  -> handlePaymentFailed(resourceBody);
            default -> log.debug("Unhandled webhook type={}", eventType);
        }
    }

    // ── Event handlers ────────────────────────────────────────────────────────

    private void handlePaymentConfirmed(Map<String, Object> resource) {
        String paypalOrderId = (String) resource.get("id");
        if (paypalOrderId == null) return;

        Payment payment = paymentService.confirmPayment(paypalOrderId);

        // Generate and persist receipts FIRST, then email
        List<Receipt> receipts = receiptService.generatePaymentReceipts(payment);

        // Find customer receipt and send email (fire-and-forget with retry)
        receipts.stream()
                .filter(r -> r.getAudience() == com.modula.payment.domain.Receipt.ReceiptAudience.customer)
                .findFirst()
                .ifPresent(r -> emailService.sendReceiptEmail(r, payment.getCustomerEmail()));

        // Notify api-core
        apiCoreWebhookClient.notifyPaymentResult(
                payment.getReferenceId(), "confirmed", payment.getId().toString());
    }

    private void handlePaymentFailed(Map<String, Object> resource) {
        String paypalOrderId = (String) resource.get("id");
        if (paypalOrderId == null) return;
        Payment payment = paymentService.failPayment(paypalOrderId);
        apiCoreWebhookClient.notifyPaymentResult(
                payment.getReferenceId(), "failed", payment.getId().toString());
    }
}
