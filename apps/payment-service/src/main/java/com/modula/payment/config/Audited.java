package com.modula.payment.config;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a service method that must be recorded in the immutable audit log.
 *
 * <p>When a method annotated with {@code @Audited} completes (successfully or
 * with an exception), {@link AuditAspect} intercepts the call and persists an
 * {@link com.modula.payment.domain.AuditLog} row with the actor, action name,
 * reference id (first {@code String} argument), serialized args, and result.
 *
 * <p>Usage:
 * <pre>{@code
 * @Audited(action = "CREATE_PAYMENT", actor = "system")
 * public PaymentResult initiatePayment(String referenceId, ...) { ... }
 * }</pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {

    /** Human-readable label written to audit_logs.action. */
    String action();

    /** Actor label written to audit_logs.actor (e.g. "system", "webhook", "api-core"). */
    String actor() default "system";
}
