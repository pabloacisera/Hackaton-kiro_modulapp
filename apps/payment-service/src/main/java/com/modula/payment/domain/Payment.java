package com.modula.payment.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Represents a payment initiated by api-core for either a direct order (Flow A)
 * or a custom quote (Flow B).
 *
 * <p>Monetary fields use {@link BigDecimal} — never float or double.
 * Idempotency is enforced via the unique {@code idempotency_key} column.
 */
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "reference_id", nullable = false)
    private String referenceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private PaymentOrigin origin;

    @Column(name = "amount_usd", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountUsd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private PaymentStatus status = PaymentStatus.initiated;

    @Column(name = "paypal_order_id", nullable = false)
    private String paypalOrderId;

    @Column(name = "idempotency_key", nullable = false, unique = true)
    private String idempotencyKey;

    @Column(name = "customer_email", nullable = false)
    private String customerEmail;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "confirmed_at")
    private OffsetDateTime confirmedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    public enum PaymentOrigin {
        order, quote
    }

    public enum PaymentStatus {
        initiated, confirmed, failed, refunded
    }
}
