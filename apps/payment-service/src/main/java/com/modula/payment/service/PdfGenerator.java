package com.modula.payment.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

/**
 * TASK-pay-9: Generates non-fiscal PDF receipts using OpenPDF (lowagie).
 *
 * <p>Receipt format:
 * <pre>
 *   MODULA — Internal Receipt (non-fiscal)
 *   Date: …
 *   Reference: …
 *   Concept: …
 *   Amount (USD): …
 *   Recipient: Customer | Admin
 *   ---
 *   This document is an internal receipt and is not valid as a fiscal invoice.
 * </pre>
 */
@Service
@Slf4j
public class PdfGenerator {

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm 'UTC'");

    /**
     * Generates a receipt PDF as a byte array.
     *
     * @param referenceId  internal reference (order_id or quote_id)
     * @param concept      human-readable description of what was purchased
     * @param amountUsd    amount charged / refunded
     * @param isRefund     true if this is a refund receipt
     * @param recipient    "Customer" or "Admin"
     * @param issuedAt     timestamp for the receipt header
     */
    public byte[] generate(String referenceId,
                            String concept,
                            BigDecimal amountUsd,
                            boolean isRefund,
                            String recipient,
                            OffsetDateTime issuedAt) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4);
            PdfWriter.getInstance(doc, out);
            doc.open();

            String type = isRefund ? "Refund Receipt" : "Payment Receipt";

            doc.add(new Paragraph("MODULA — " + type + " (Internal — Non-Fiscal)",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14)));
            doc.add(Chunk.NEWLINE);
            doc.add(line("Date",      FMT.format(issuedAt)));
            doc.add(line("Reference", referenceId));
            doc.add(line("Concept",   concept));
            doc.add(line("Amount",    "USD " + amountUsd.toPlainString()));
            doc.add(line("Recipient", recipient));
            doc.add(Chunk.NEWLINE);
            doc.add(new Paragraph(
                    "This document is an internal receipt and is not valid as a fiscal invoice.",
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9)));

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("PDF generation failed for ref={}: {}", referenceId, e.getMessage());
            throw new RuntimeException("PDF generation failed", e);
        }
    }

    private Paragraph line(String label, String value) {
        Paragraph p = new Paragraph();
        p.add(new Chunk(label + ": ",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11)));
        p.add(new Chunk(value,
                FontFactory.getFont(FontFactory.HELVETICA, 11)));
        return p;
    }
}
