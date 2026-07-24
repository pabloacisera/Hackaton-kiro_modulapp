package com.modula.payment.service;

import com.modula.payment.domain.Payment;
import com.modula.payment.domain.Receipt;
import com.modula.payment.domain.Receipt.ReceiptAudience;
import com.modula.payment.domain.Refund;
import com.modula.payment.domain.Refund.RefundStatus;
import com.modula.payment.repository.ReceiptRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ReceiptServiceTest {

    private ReceiptRepository receiptRepository;
    private PdfGenerator pdfGenerator;
    private SupabaseStorageClient storageClient;
    private ReceiptService receiptService;

    @BeforeEach
    void setUp() {
        receiptRepository = mock(ReceiptRepository.class);
        pdfGenerator      = mock(PdfGenerator.class);
        storageClient     = mock(SupabaseStorageClient.class);
        when(pdfGenerator.generate(any(), any(), any(), anyBoolean(), any(), any()))
                .thenReturn("PDF-BYTES".getBytes());
        when(receiptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(storageClient.upload(any(), any(), any(), any()))
                .thenReturn("https://supabase.co/storage/v1/object/public/bucket/receipts/test.pdf");

        receiptService = new ReceiptService(receiptRepository, pdfGenerator, storageClient);
    }

    // ── Payment receipts ──────────────────────────────────────────────────────

    @Test
    void generatePaymentReceipts_producesTwoReceipts_customerAndAdmin() {
        Payment payment = payment("ref-1", new BigDecimal("100.00"));
        List<Receipt> receipts = receiptService.generatePaymentReceipts(payment);

        assertThat(receipts).hasSize(2);
        assertThat(receipts).anyMatch(r -> r.getAudience() == ReceiptAudience.customer);
        assertThat(receipts).anyMatch(r -> r.getAudience() == ReceiptAudience.admin);
    }

    @Test
    void generatePaymentReceipts_persistsBeforeReturning() {
        Payment payment = payment("ref-2", new BigDecimal("50.00"));
        receiptService.generatePaymentReceipts(payment);

        // Two receipts persisted (customer + admin)
        verify(receiptRepository, times(2)).save(any(Receipt.class));
    }

    @Test
    void generatePaymentReceipts_receiptLinkedToPayment() {
        Payment payment = payment("ref-3", new BigDecimal("200.00"));
        List<Receipt> receipts = receiptService.generatePaymentReceipts(payment);

        receipts.forEach(r -> {
            assertThat(r.getPayment()).isSameAs(payment);
            assertThat(r.getRefund()).isNull();
        });
    }

    // ── Refund receipts ───────────────────────────────────────────────────────

    @Test
    void generateRefundReceipts_producesTwoReceipts_withRefundType() {
        Refund refund = refund("ref-4");
        List<Receipt> receipts = receiptService.generateRefundReceipts(refund);

        assertThat(receipts).hasSize(2);
        receipts.forEach(r -> {
            assertThat(r.getRefund()).isSameAs(refund);
            assertThat(r.getPayment()).isNull();
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Payment payment(String refId, BigDecimal amount) {
        Payment p = new Payment();
        p.setReferenceId(refId);
        p.setAmountUsd(amount);
        p.setCustomerEmail("c@test.com");
        try {
            var f = Payment.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(p, UUID.randomUUID());
        } catch (Exception e) { /* ignore */ }
        return p;
    }

    private Refund refund(String refId) {
        Payment p = payment(refId, new BigDecimal("50.00"));
        Refund r = new Refund();
        r.setPayment(p);
        r.setRefundRequestId("RRID");
        r.setPaypalRefundId("PAYPAL-REFUND");
        r.setReason("rejected");
        r.setStatus(RefundStatus.processed);
        return r;
    }
}
