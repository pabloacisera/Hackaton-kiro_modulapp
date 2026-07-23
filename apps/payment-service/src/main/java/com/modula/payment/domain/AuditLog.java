package com.modula.payment.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Immutable audit trail entry for all payment-service operations.
 *
 * <p>This entity is append-only. There are no setters — rows are created once
 * and never modified. The DB schema has no UPDATE/DELETE grants on this table.
 */
@Entity
@Table(name = "audit_logs")
@Getter
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false)
    private String actor;

    @Column(nullable = false)
    private String action;

    @Column(name = "reference_id", nullable = false)
    private String referenceId;

    @Column(name = "payload_json", nullable = false, columnDefinition = "TEXT")
    private String payloadJson;

    @Column(nullable = false)
    private String result;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    /** Builder-style factory — the only way to create an audit entry. */
    public static AuditLog of(
            String actor,
            String action,
            String referenceId,
            String payloadJson,
            String result) {

        AuditLog log = new AuditLog();
        log.actor = actor;
        log.action = action;
        log.referenceId = referenceId;
        log.payloadJson = payloadJson;
        log.result = result;
        return log;
    }
}
