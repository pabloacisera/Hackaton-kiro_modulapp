package com.modula.payment.service;

import com.modula.payment.domain.Payment;
import com.modula.payment.domain.Payment.PaymentStatus;
import com.modula.payment.domain.Refund;
import com.modula.payment.domain.Refund.RefundStatus;
import com.modula.payment.repository.PaymentRepository;
import com.modula.payment.repository.RefundRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class RefundServiceTest {

    private RefundRepository refundRepository;
    private PaymentRepository paymentRepository;
    private PayPalRefundClient payPalRefundClient;
    private RefundService service;

    @BeforeEach
    void setUp() {
        refundRepository  = mock(RefundRepository.class);
        paymentRepository = mock(PaymentRepository.class);
        payPalRefundClient = mock(PayPalRefundClient.class);
        service = new RefundService(refundRepository, paymentRepository, payPalRefundClient);
    }

    // ── Idempotency ───────────────────────────────────────────────────────────

    @Test
    void refund_duplicateRefundRequestId_returnsExisting_withoutCallingPayPal() {
        Refund existing = new Refund();
        existing.setRefundRequestId("RRID-1");
        when(refundRepository.findByRefundRequestId("RRID-1"))
                .thenReturn(Optional.of(existing));

        Refund result = service.refund("ref-1", "rejected by admin", "RRID-1");

        assertThat(result).isSameAs(existing);
        verifyNoInteractions(payPalRefundClient);
    }

    // ── New refund ────────────────────────────────────────────────────────────

    @Test
    void refund_newRequest_callsPayPal_persistsRefund_updatesPaymentStatus() {
        when(refundRepository.findByRefundRequestId("RRID-NEW"))
                .thenReturn(Optional.empty());

        Payment payment = confirmedPayment();
        when(paymentRepository.findByReferenceId("ref-2"))
                .thenReturn(Optional.of(payment));
        when(payPalRefundClient.refund(any(), any()))
                .thenReturn(new PayPalRefundClient.RefundResult("REFUND-001", "COMPLETED"));
        when(refundRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Refund refund = service.refund("ref-2", "order rejected", "RRID-NEW");

        assertThat(refund.getStatus()).isEqualTo(RefundStatus.processed);
        assertThat(refund.getPaypalRefundId()).isEqualTo("REFUND-001");
        verify(paymentRepository).save(argThat(p -> p.getStatus() == PaymentStatus.refunded));
    }

    // ── Payment not found ─────────────────────────────────────────────────────

    @Test
    void refund_paymentNotFound_throws404() {
        when(refundRepository.findByRefundRequestId(anyString()))
                .thenReturn(Optional.empty());
        when(paymentRepository.findByReferenceId("missing"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.refund("missing", "reason", "RRID-X"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("not found");
    }

    // ── Payment not confirmed ─────────────────────────────────────────────────

    @Test
    void refund_paymentNotConfirmed_throwsUnprocessableEntity() {
        when(refundRepository.findByRefundRequestId(anyString()))
                .thenReturn(Optional.empty());

        Payment payment = confirmedPayment();
        payment.setStatus(PaymentStatus.initiated); // not confirmed
        when(paymentRepository.findByReferenceId("ref-3"))
                .thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> service.refund("ref-3", "reason", "RRID-Y"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Cannot refund");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Payment confirmedPayment() {
        Payment p = new Payment();
        p.setReferenceId("ref-2");
        p.setStatus(PaymentStatus.confirmed);
        p.setAmountUsd(new BigDecimal("75.00"));
        p.setPaypalOrderId("ORDER-ABC");
        try {
            var f = Payment.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(p, UUID.randomUUID());
        } catch (Exception e) { /* ignore */ }
        return p;
    }
}
