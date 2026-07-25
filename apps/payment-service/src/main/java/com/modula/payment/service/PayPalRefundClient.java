package com.modula.payment.service;

import com.modula.payment.config.PayPalProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Calls PayPal Refunds API (POST /v2/payments/captures/{captureId}/refund).
 * Intentionally separate from {@link PayPalClient} to keep refund concerns isolated.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayPalRefundClient {

    private final PayPalProperties props;
    @Qualifier("paypalRestTemplate")
    private final RestTemplate restTemplate;
    private final PayPalClient payPalClient; // reuse token logic

    /**
     * Executes a refund for an already-captured PayPal payment.
     *
     * @param captureId PayPal capture ID from the original payment
     * @param amount    exact amount to refund (must not exceed original)
     * @return {@link RefundResult} with PayPal refund ID and status
     */
    public RefundResult refund(String captureId, BigDecimal amount) {
        String token = payPalClient.getAccessToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        Map<String, Object> body = Map.of(
                "amount", Map.of(
                        "value", amount.toPlainString(),
                        "currency_code", "USD"
                )
        );

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    props.getBaseUrl() + "/v2/payments/captures/" + captureId + "/refund",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    (Class<Map<String, Object>>) (Class<?>) Map.class
            );
            Map<String, Object> data = response.getBody();
            String refundId = (String) data.get("id");
            String status   = (String) data.get("status");
            return new RefundResult(refundId, status);
        } catch (RestClientException ex) {
            log.error("PayPal refund failed for captureId={}: {}", captureId, ex.getMessage());
            throw new PayPalClient.PayPalException(
                    "Failed to execute PayPal refund: " + ex.getMessage(), ex);
        }
    }

    public record RefundResult(String refundId, String status) {}
}
