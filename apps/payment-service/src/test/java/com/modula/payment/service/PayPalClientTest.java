package com.modula.payment.service;

import com.modula.payment.config.PayPalProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PayPalClientTest {

    private PayPalProperties props;
    private RestTemplate restTemplate;
    private PayPalClient client;

    @BeforeEach
    void setUp() {
        props = new PayPalProperties();
        props.setClientId("test-client");
        props.setClientSecret("test-secret");
        props.setMode("sandbox");

        restTemplate = mock(RestTemplate.class);
        client = new PayPalClient(props, restTemplate);
    }

    // ── Token ─────────────────────────────────────────────────────────────────

    @Test
    void getAccessToken_callsOAuthEndpoint_andCachesResult() {
        mockTokenResponse();
        String token = client.getAccessToken();
        assertThat(token).isEqualTo("test-access-token");
        // Second call should use cache (only 1 actual HTTP call)
        client.getAccessToken();
        verify(restTemplate, times(1))
                .exchange(contains("/oauth2/token"), eq(HttpMethod.POST), any(), eq(Map.class));
    }

    // ── createOrder ───────────────────────────────────────────────────────────

    @Test
    void createOrder_returnsOrderIdAndApprovalUrl() {
        mockTokenResponse();

        Map<String, Object> orderResponse = Map.of(
                "id", "PAYPAL-ORDER-123",
                "links", List.of(
                        Map.of("rel", "approve", "href", "https://paypal.com/approve?token=XYZ"),
                        Map.of("rel", "self", "href", "https://api.paypal.com/v2/checkout/orders/PAYPAL-ORDER-123")
                )
        );
        when(restTemplate.exchange(contains("/v2/checkout/orders"), eq(HttpMethod.POST),
                any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(orderResponse));

        var result = client.createOrder(new BigDecimal("99.99"), "order-001", "customer@test.com");

        assertThat(result.orderId()).isEqualTo("PAYPAL-ORDER-123");
        assertThat(result.approvalUrl()).contains("approve");
    }

    @Test
    void createOrder_onHttpError_throwsPayPalException_notRawException() {
        mockTokenResponse();
        when(restTemplate.exchange(contains("/v2/checkout/orders"), eq(HttpMethod.POST),
                any(), eq(Map.class)))
                .thenThrow(new RestClientException("connection refused"));

        assertThatThrownBy(() ->
                client.createOrder(BigDecimal.TEN, "ref", "email@test.com"))
                .isInstanceOf(PayPalClient.PayPalException.class)
                .hasMessageContaining("Failed to create PayPal order");
    }

    // ── captureOrder ──────────────────────────────────────────────────────────

    @Test
    void captureOrder_returnsCaptureIdAndStatus() {
        mockTokenResponse();

        Map<String, Object> captureResponse = Map.of(
                "status", "COMPLETED",
                "purchase_units", List.of(Map.of(
                        "payments", Map.of(
                                "captures", List.of(Map.of("id", "CAPTURE-001"))
                        )
                ))
        );
        when(restTemplate.exchange(contains("/capture"), eq(HttpMethod.POST),
                any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(captureResponse));

        var result = client.captureOrder("PAYPAL-ORDER-123");

        assertThat(result.captureId()).isEqualTo("CAPTURE-001");
        assertThat(result.status()).isEqualTo("COMPLETED");
    }

    @Test
    void captureOrder_onError_throwsPayPalException() {
        mockTokenResponse();
        when(restTemplate.exchange(contains("/capture"), eq(HttpMethod.POST),
                any(), eq(Map.class)))
                .thenThrow(new RestClientException("timeout"));

        assertThatThrownBy(() -> client.captureOrder("ORDER-X"))
                .isInstanceOf(PayPalClient.PayPalException.class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void mockTokenResponse() {
        when(restTemplate.exchange(contains("/oauth2/token"), eq(HttpMethod.POST),
                any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(
                        Map.of("access_token", "test-access-token", "expires_in", 32400)));
    }
}
