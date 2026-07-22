package com.modula.payment.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Non-fiscal PDF receipt generated for a confirmed payment or executed refund.
 *
 * <p>A receipt belongs exclusively to either a {@link Payment} or a {@link Refund},
 * enforced by a DB check constraint. It is persisted before any email attempt,
 * so the receipt is never lost due to mail delivery failure.
 */
@Entity
@Table(name = "receipts")
@Getter
@Setter
@NoArgsConstructor
public class Receipt {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "refund_id")
    private Refund refund;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private ReceiptAudience audience;

    @Column(name = "pdf_url", nullable = false, length = 512)
    private String pdfUrl;

    @Column(name = "sent_at")
    private OffsetDateTime sentAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    public enum ReceiptAudience {
        customer, admin
    }
}
