package com.modula.payment.service;

import com.modula.payment.domain.Payment;
import com.modula.payment.domain.Receipt;
import com.modula.payment.domain.Receipt.ReceiptAudience;
import com.modula.payment.domain.Refund;
import com.modula.payment.repository.ReceiptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * TASK-pay-9 / TASK-pay-13: Generates and persists PDF receipts.
 *
 * <p>Receipts are ALWAYS persisted before any side effect (email).
 * If email sending fails, the receipt is not lost.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReceiptService {

    private final ReceiptRepository receiptRepository;
    private final PdfGenerator pdfGenerator;

    /**
     * Generates customer + admin receipts for a confirmed payment.
     * Persists both before returning.
     *
     * @return list of two persisted receipts [customer, admin]
     */
    @Transactional
    public List<Receipt> generatePaymentReceipts(Payment payment) {
        OffsetDateTime now = OffsetDateTime.now();
        String concept = "Modula prototype order — ref: " + payment.getReferenceId();

        Receipt customer = persist(payment, null, ReceiptAudience.customer,
                concept, false, now);
        Receipt admin    = persist(payment, null, ReceiptAudience.admin,
                concept, false, now);

        log.info("Generated payment receipts for ref={}", payment.getReferenceId());
        return List.of(customer, admin);
    }

    /**
     * Generates customer + admin receipts for an executed refund.
     * Persists both before returning.
     *
     * @return list of two persisted receipts [customer, admin]
     */
    @Transactional
    public List<Receipt> generateRefundReceipts(Refund refund) {
        OffsetDateTime now = OffsetDateTime.now();
        String concept = "Refund for order — ref: " + refund.getPayment().getReferenceId();

        Receipt customer = persist(null, refund, ReceiptAudience.customer,
                concept, true, now);
        Receipt admin    = persist(null, refund, ReceiptAudience.admin,
                concept, true, now);

        log.info("Generated refund receipts for refundId={}", refund.getId());
        return List.of(customer, admin);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Receipt persist(Payment payment,
                             Refund refund,
                             ReceiptAudience audience,
                             String concept,
                             boolean isRefund,
                             OffsetDateTime issuedAt) {

        String referenceId = payment != null
                ? payment.getReferenceId()
                : refund.getPayment().getReferenceId();

        var amountUsd = payment != null
                ? payment.getAmountUsd()
                : refund.getPayment().getAmountUsd();

        byte[] pdf = pdfGenerator.generate(
                referenceId, concept, amountUsd, isRefund,
                audience == ReceiptAudience.customer ? "Customer" : "Admin",
                issuedAt);

        // In a real deployment, upload to Supabase Storage and store the URL.
        // For now, store a base64 data URL so the PDF is always retrievable.
        String pdfUrl = "data:application/pdf;base64,"
                + java.util.Base64.getEncoder().encodeToString(pdf);

        Receipt receipt = new Receipt();
        receipt.setPayment(payment);
        receipt.setRefund(refund);
        receipt.setAudience(audience);
        receipt.setPdfUrl(pdfUrl);

        return receiptRepository.save(receipt);
    }
}
