package com.modula.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * TASK-pay-8: Sends payment results back to api-core via HTTP POST.
 * Retries up to 3 times on transient failures (5xx / connection errors).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ApiCoreWebhookClient {

    private final RestTemplate restTemplate;

    @Value("${api-core.webhook-url:http://api-core:8080}")
    private String apiCoreBaseUrl;

    /**
     * POSTs a payment result to api-core's webhook endpoint.
     *
     * @param referenceId          the order or quote ID from api-core
     * @param status               "confirmed" | "failed"
     * @param paymentServiceRef    internal payment UUID
     */
    @Retryable(
        retryFor = RestClientException.class,
        maxAttempts = 3,
        backoff = @Backoff(delay = 500, multiplier = 2)
    )
    public void notifyPaymentResult(String referenceId,
                                     String status,
                                     String paymentServiceRef) {
        String url = apiCoreBaseUrl + "/orders/webhooks/payment-result";
        Map<String, String> body = Map.of(
                "reference_id",       referenceId,
                "status",             status,
                "payment_service_ref", paymentServiceRef
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            restTemplate.exchange(url, HttpMethod.POST,
                    new HttpEntity<>(body, headers), Void.class);
            log.info("Notified api-core: ref={} status={}", referenceId, status);
        } catch (RestClientException ex) {
            log.error("Failed to notify api-core (will retry): {}", ex.getMessage());
            throw ex;
        }
    }
}
