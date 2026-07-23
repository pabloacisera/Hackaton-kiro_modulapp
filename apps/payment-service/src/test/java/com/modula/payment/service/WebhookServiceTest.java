package com.modula.payment.service;

import com.modula.payment.config.PayPalProperties;
import com.modula.payment.domain.Payment;
import com.modula.payment.domain.Payment.PaymentStatus;
import com.modula.payment.domain.Receipt;
import com.modula.payment.domain.Receipt.ReceiptAudience;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class WebhookServiceTest {

    private PaymentService paymentService;
    private ReceiptService receiptService;
    private EmailService emailService;
    private ApiCoreWebhookClient apiCoreWebhookClient;
    private WebhookService webhookService;

    @BeforeEach
    void setUp() {
        paymentService       = mock(PaymentService.class);
        receiptService       = mock(ReceiptService.class);
        emailService         = mock(EmailService.class);
        apiCoreWebhookClient = mock(ApiCoreWebhookClient.class);
        PayPalProperties props = new PayPalProperties();
        props.setWebhookId("WH-ID-TEST");

        webhookService = new WebhookService(
                paymentService, receiptService, emailService, apiCoreWebhookClient, props);
    }

    // ── Deduplication ─────────────────────────────────────────────────────────

    @Test
    void process_duplicateEventId_isIgnored_noSideEffects() {
        Payment payment = confirmedPayment();
        when(paymentService.confirmPayment(any())).thenReturn(payment);
        when(receiptService.generatePaymentReceipts(any())).thenReturn(List.of());

        Map<String, Object> resource = Map.of("id", "ORDER-DEDUP");

        // First call — processed
        webhookService.process("EVENT-1", "sig", "CHECKOUT.ORDER.APPROVED", resource);
        // Second call with same event ID — should be ignored
        webhookService.process("EVENT-1", "sig", "CHECKOUT.ORDER.APPROVED", resource);

        verify(paymentService, times(1)).confirmPayment("ORDER-DEDUP");
    }

    // ── Signature missing → 401 ───────────────────────────────────────────────

    @Test
    void process_missingSignature_throws401() {
        assertThatThrownBy(() ->
                webhookService.process("EVENT-X", null, "CHECKOUT.ORDER.APPROVED", Map.of()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("signature");
    }

    // ── Confirmed event ───────────────────────────────────────────────────────

    @Test
    void process_paymentCaptureCompleted_confirmsPayment_generatesReceipts_notifiesApiCore() {
        Payment payment = confirmedPayment();
        when(paymentService.confirmPayment("ORDER-CONF")).thenReturn(payment);

        Receipt customerReceipt = new Receipt();
        customerReceipt.setAudience(ReceiptAudience.customer);

        when(receiptService.generatePaymentReceipts(payment))
                .thenReturn(List.of(customerReceipt));

        webhookService.process("EVT-2", "valid-sig",
                "PAYMENT.CAPTURE.COMPLETED", Map.of("id", "ORDER-CONF"));

        verify(paymentService).confirmPayment("ORDER-CONF");
        verify(receiptService).generatePaymentReceipts(payment);
        verify(emailService).sendReceiptEmail(eq(customerReceipt), eq("customer@test.com"));
        verify(apiCoreWebhookClient).notifyPaymentResult(
                eq("ref-123"), eq("confirmed"), any());
    }

    // ── Failed event → INITIATED→FAILED ──────────────────────────────────────

    @Test
    void process_paymentCaptureDenied_failsPayment_notifiesApiCore() {
        Payment payment = confirmedPayment();
        payment.setStatus(PaymentStatus.failed);
        when(paymentService.failPayment("ORDER-FAIL")).thenReturn(payment);

        webhookService.process("EVT-3", "sig",
                "PAYMENT.CAPTURE.DENIED", Map.of("id", "ORDER-FAIL"));

        verify(paymentService).failPayment("ORDER-FAIL");
        verify(apiCoreWebhookClient).notifyPaymentResult(eq("ref-123"), eq("failed"), any());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Payment confirmedPayment() {
        Payment p = new Payment();
        p.setReferenceId("ref-123");
        p.setCustomerEmail("customer@test.com");
        p.setStatus(PaymentStatus.confirmed);
        p.setAmountUsd(BigDecimal.TEN);
        try {
            var f = Payment.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(p, UUID.randomUUID());
        } catch (Exception e) { /* ignore */ }
        return p;
    }
}
