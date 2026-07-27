package com.modula.payment.service;

import com.modula.payment.config.PayPalProperties;
import com.modula.payment.domain.Payment;
import com.modula.payment.domain.Payment.PaymentOrigin;
import com.modula.payment.domain.Payment.PaymentStatus;
import com.modula.payment.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PaymentServiceTest {

    private PaymentRepository paymentRepository;
    private PayPalClient payPalClient;
    private PayPalProperties payPalProperties;
    private PaymentService service;

    @BeforeEach
    void setUp() {
        paymentRepository = mock(PaymentRepository.class);
        payPalClient      = mock(PayPalClient.class);
        payPalProperties  = mock(PayPalProperties.class);
        service           = new PaymentService(paymentRepository, payPalClient, payPalProperties);
    }

    // ── Idempotency ───────────────────────────────────────────────────────────

    @Test
    void initiatePayment_duplicateIdempotencyKey_returnsExisting_withoutCallingPayPal() {
        Payment existing = existingPayment("IDEM-KEY-1", "PAYPAL-ORDER-001");
        when(paymentRepository.findByIdempotencyKey("IDEM-KEY-1"))
                .thenReturn(Optional.of(existing));
        when(payPalProperties.getMode()).thenReturn("sandbox");

        var result = service.initiatePayment(
                "ref-1", PaymentOrigin.order, BigDecimal.TEN,
                "c@test.com", "IDEM-KEY-1");

        assertThat(result.created()).isFalse();
        assertThat(result.paymentServiceRef()).isEqualTo(existing.getId().toString());
        verifyNoInteractions(payPalClient);
    }

    // ── New payment ───────────────────────────────────────────────────────────

    @Test
    void initiatePayment_newKey_callsPayPal_persistsPayment_returnsCreated() {
        when(paymentRepository.findByIdempotencyKey(anyString()))
                .thenReturn(Optional.empty());
        when(payPalClient.createOrder(any(), any(), any()))
                .thenReturn(new PayPalClient.PayPalOrderResult(
                        "PAYPAL-ORDER-NEW",
                        "https://paypal.com/approve?token=NEW"));
        Payment saved = existingPayment("IDEM-KEY-2", "PAYPAL-ORDER-NEW");
        when(paymentRepository.save(any())).thenReturn(saved);

        var result = service.initiatePayment(
                "ref-2", PaymentOrigin.order, new BigDecimal("55.00"),
                "c@test.com", "IDEM-KEY-2");

        assertThat(result.created()).isTrue();
        assertThat(result.paymentLink()).contains("approve");
        verify(paymentRepository).save(any(Payment.class));
    }

    // ── Confirm / Fail ────────────────────────────────────────────────────────

    @Test
    void confirmPayment_setsStatusConfirmed_andConfirmedAt() {
        Payment p = existingPayment("k", "ORDER-XYZ");
        when(paymentRepository.findByPaypalOrderId("ORDER-XYZ"))
                .thenReturn(Optional.of(p));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Payment confirmed = service.confirmPayment("ORDER-XYZ");

        assertThat(confirmed.getStatus()).isEqualTo(PaymentStatus.confirmed);
        assertThat(confirmed.getConfirmedAt()).isNotNull();
    }

    @Test
    void failPayment_setsStatusFailed() {
        Payment p = existingPayment("k", "ORDER-FAIL");
        when(paymentRepository.findByPaypalOrderId("ORDER-FAIL"))
                .thenReturn(Optional.of(p));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Payment failed = service.failPayment("ORDER-FAIL");

        assertThat(failed.getStatus()).isEqualTo(PaymentStatus.failed);
    }

    // ── PayPal error ──────────────────────────────────────────────────────────

    @Test
    void initiatePayment_paypalError_propagatesPayPalException() {
        when(paymentRepository.findByIdempotencyKey(anyString()))
                .thenReturn(Optional.empty());
        when(payPalClient.createOrder(any(), any(), any()))
                .thenThrow(new PayPalClient.PayPalException("PayPal down",
                        new RuntimeException()));

        assertThatThrownBy(() ->
                service.initiatePayment("ref", PaymentOrigin.quote,
                        BigDecimal.ONE, "e@t.com", "IDEM-ERR"))
                .isInstanceOf(PayPalClient.PayPalException.class);

        verify(paymentRepository, never()).save(any());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Payment existingPayment(String idempotencyKey, String paypalOrderId) {
        Payment p = new Payment();
        p.setIdempotencyKey(idempotencyKey);
        p.setPaypalOrderId(paypalOrderId);
        p.setReferenceId("ref");
        p.setOrigin(PaymentOrigin.order);
        p.setAmountUsd(BigDecimal.TEN);
        p.setCustomerEmail("c@test.com");
        p.setStatus(PaymentStatus.initiated);
        // Set UUID via reflection to avoid needing DB
        try {
            var f = Payment.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(p, UUID.randomUUID());
        } catch (Exception e) { /* ignore */ }
        return p;
    }
}
