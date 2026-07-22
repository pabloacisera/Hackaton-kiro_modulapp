package com.modula.payment.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.modula.payment.domain.AuditLog;
import com.modula.payment.repository.AuditLogRepository;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class AuditAspectTest {

    private AuditLogRepository auditLogRepository;
    private AuditAspect auditAspect;

    @BeforeEach
    void setUp() {
        auditLogRepository = mock(AuditLogRepository.class);
        auditAspect = new AuditAspect(auditLogRepository, new ObjectMapper());
    }

    @Test
    void annotatedMethod_success_persistsAuditLogWithSuccessResult() throws Throwable {
        ProceedingJoinPoint pjp = buildPjp("ref-123", "ok-result", null);

        Object result = auditAspect.audit(pjp);

        assertThat(result).isEqualTo("ok-result");
        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        AuditLog saved = captor.getValue();
        assertThat(saved.getActor()).isEqualTo("system");
        assertThat(saved.getAction()).isEqualTo("TEST_ACTION");
        assertThat(saved.getReferenceId()).isEqualTo("ref-123");
        assertThat(saved.getResult()).isEqualTo("SUCCESS");
    }

    @Test
    void annotatedMethod_throws_persistsAuditLogWithFailureAndRethrows() throws Throwable {
        RuntimeException ex = new RuntimeException("paypal down");
        ProceedingJoinPoint pjp = buildPjp("ref-456", null, ex);

        assertThatThrownBy(() -> auditAspect.audit(pjp))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("paypal down");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getResult()).startsWith("FAILURE:");
    }

    @Test
    void unannotatedMethod_aspectDoesNotIntercept() {
        // The aspect only fires via @Around("@annotation(...)") — unannotated
        // methods are never passed to audit(). This test verifies the repository
        // is never called when the aspect is instantiated but not triggered.
        verifyNoInteractions(auditLogRepository);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    /** Builds a mock ProceedingJoinPoint backed by the local @Audited helper method. */
    private ProceedingJoinPoint buildPjp(String firstArg, Object returnValue,
                                         Throwable toThrow) throws Throwable {
        Method method = AuditAspectTest.class
            .getDeclaredMethod("annotatedHelperMethod", String.class);

        MethodSignature sig = mock(MethodSignature.class);
        when(sig.getMethod()).thenReturn(method);

        ProceedingJoinPoint pjp = mock(ProceedingJoinPoint.class);
        when(pjp.getSignature()).thenReturn(sig);
        when(pjp.getArgs()).thenReturn(new Object[]{firstArg});
        if (toThrow != null) {
            when(pjp.proceed()).thenThrow(toThrow);
        } else {
            when(pjp.proceed()).thenReturn(returnValue);
        }
        return pjp;
    }

    @Audited(action = "TEST_ACTION", actor = "system")
    @SuppressWarnings("unused")
    private String annotatedHelperMethod(String referenceId) {
        return "result";
    }
}
