package com.modula.payment.service;

import com.modula.payment.config.PayPalProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

/**
 * Low-level PayPal Orders API client (REST v2).
 * Handles OAuth token acquisition, order creation, and order capture.
 * All calls use the dedicated paypalRestTemplate (with explicit timeouts).
 *
 * <p>This class is deliberately thin — it maps HTTP ↔ domain objects and
 * never applies business logic (idempotency, audit). Those live in
 * {@link PaymentService}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayPalClient {

    private final PayPalProperties props;
    @Qualifier("paypalRestTemplate")
    private final RestTemplate restTemplate;

    // ── Token cache (simple, single-node) ────────────────────────────────────

    private String cachedToken;
    private long tokenExpiresAt = 0;

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Creates a PayPal Order and returns the approval URL.
     *
     * @param amountUsd    USD amount (BigDecimal, not float)
     * @param referenceId  business reference (order_id / quote_id from api-core)
     * @param customerEmail used for payer description only
     * @return {@link PayPalOrderResult} containing the order id and approval URL
     */
    public PayPalOrderResult createOrder(BigDecimal amountUsd,
                                         String referenceId,
                                         String customerEmail) {
        String token = getAccessToken();
        HttpHeaders headers = jsonHeaders(token);

        Map<String, Object> body = Map.of(
                "intent", "CAPTURE",
                "purchase_units", List.of(Map.of(
                        "reference_id", referenceId,
                        "amount", Map.of("currency_code", "USD",
                                         "value", amountUsd.toPlainString())
                )),
                "payment_source", Map.of(
                        "paypal", Map.of(
                                "experience_context", Map.of(
                                        "return_url", props.getAppPublicUrl() + "/checkout/success",
                                        "cancel_url", props.getAppPublicUrl() + "/checkout/cancel"
                                )
                        )
                )
        );

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    props.getBaseUrl() + "/v2/checkout/orders",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> data = response.getBody();
            String orderId = (String) data.get("id");
            String approvalUrl = extractApprovalUrl(data);

            return new PayPalOrderResult(orderId, approvalUrl);
        } catch (RestClientException ex) {
            log.error("PayPal createOrder failed for ref={}: {}", referenceId, ex.getMessage());
            throw new PayPalException("Failed to create PayPal order: " + ex.getMessage(), ex);
        }
    }

    /**
     * Captures a previously created PayPal Order.
     *
     * @param paypalOrderId the PayPal order ID returned by {@link #createOrder}
     * @return {@link PayPalCaptureResult} with capture ID and status
     */
    public PayPalCaptureResult captureOrder(String paypalOrderId) {
        String token = getAccessToken();
        HttpHeaders headers = jsonHeaders(token);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    props.getBaseUrl() + "/v2/checkout/orders/" + paypalOrderId + "/capture",
                    HttpMethod.POST,
                    new HttpEntity<>(Map.of(), headers),
                    Map.class
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> data = response.getBody();
            String captureId = extractCaptureId(data);
            String status    = (String) data.get("status");

            return new PayPalCaptureResult(captureId, status);
        } catch (RestClientException ex) {
            log.error("PayPal captureOrder failed for orderId={}: {}", paypalOrderId, ex.getMessage());
            throw new PayPalException("Failed to capture PayPal order: " + ex.getMessage(), ex);
        }
    }

    // ── OAuth token ──────────────────────────────────────────────────────────

    String getAccessToken() {
        if (cachedToken != null && System.currentTimeMillis() < tokenExpiresAt - 60_000) {
            return cachedToken;
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth(props.getClientId(), props.getClientSecret());

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    props.getBaseUrl() + "/v1/oauth2/token",
                    HttpMethod.POST,
                    new HttpEntity<>(form, headers),
                    Map.class
            );
            @SuppressWarnings("unchecked")
            Map<String, Object> body = response.getBody();
            cachedToken = (String) body.get("access_token");
            int expiresIn = (Integer) body.getOrDefault("expires_in", 32400);
            tokenExpiresAt = System.currentTimeMillis() + (expiresIn * 1000L);
            return cachedToken;
        } catch (RestClientException ex) {
            throw new PayPalException("Failed to obtain PayPal access token: " + ex.getMessage(), ex);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private HttpHeaders jsonHeaders(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.setBearerAuth(token);
        return h;
    }

    @SuppressWarnings("unchecked")
    private String extractApprovalUrl(Map<String, Object> data) {
        List<Map<String, String>> links = (List<Map<String, String>>) data.get("links");
        if (links == null) return null;
        return links.stream()
                .filter(l -> "approve".equals(l.get("rel")) || "payer-action".equals(l.get("rel")))
                .map(l -> l.get("href"))
                .findFirst()
                .orElse(null);
    }

    @SuppressWarnings("unchecked")
    private String extractCaptureId(Map<String, Object> data) {
        List<Map<String, Object>> units =
                (List<Map<String, Object>>) data.get("purchase_units");
        if (units == null || units.isEmpty()) return null;
        Map<String, Object> payments =
                (Map<String, Object>) units.get(0).get("payments");
        if (payments == null) return null;
        List<Map<String, Object>> captures =
                (List<Map<String, Object>>) payments.get("captures");
        if (captures == null || captures.isEmpty()) return null;
        return (String) captures.get(0).get("id");
    }

    // ── Result types ─────────────────────────────────────────────────────────

    public record PayPalOrderResult(String orderId, String approvalUrl) {}
    public record PayPalCaptureResult(String captureId, String status) {}

    /** Wraps any PayPal REST error — never leaks raw HTTP exceptions to callers. */
    public static class PayPalException extends RuntimeException {
        public PayPalException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
