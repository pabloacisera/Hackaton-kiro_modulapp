package com.modula.payment.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.modula.payment.domain.AuditLog;
import com.modula.payment.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

/**
 * AOP aspect that intercepts every method annotated with {@link Audited}
 * and writes an immutable {@link AuditLog} row regardless of outcome.
 *
 * <p>The first {@code String} argument is treated as the {@code reference_id}.
 * If no String argument is present, the reference is set to "unknown".
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Around("@annotation(com.modula.payment.config.Audited)")
    public Object audit(ProceedingJoinPoint pjp) throws Throwable {
        MethodSignature signature = (MethodSignature) pjp.getSignature();
        Method method = signature.getMethod();
        Audited audited = method.getAnnotation(Audited.class);

        String actor      = audited.actor();
        String action     = audited.action();
        String referenceId = extractReferenceId(pjp.getArgs());
        String payload    = serializeArgs(pjp.getArgs());

        try {
            Object result = pjp.proceed();
            persist(actor, action, referenceId, payload, "SUCCESS");
            return result;
        } catch (Throwable ex) {
            persist(actor, action, referenceId, payload, "FAILURE: " + ex.getMessage());
            throw ex;
        }
    }

    // -------------------------------------------------------------------------

    private String extractReferenceId(Object[] args) {
        if (args == null) return "unknown";
        for (Object arg : args) {
            if (arg instanceof String s) return s;
        }
        return "unknown";
    }

    private String serializeArgs(Object[] args) {
        try {
            return objectMapper.writeValueAsString(args);
        } catch (JsonProcessingException e) {
            return "[unserializable]";
        }
    }

    private void persist(String actor, String action, String referenceId,
                         String payload, String result) {
        try {
            auditLogRepository.save(
                AuditLog.of(actor, action, referenceId, payload, result));
        } catch (Exception e) {
            // Audit must never break the main flow — log and continue.
            log.error("Failed to persist audit log for action={} ref={}: {}",
                action, referenceId, e.getMessage());
        }
    }
}
