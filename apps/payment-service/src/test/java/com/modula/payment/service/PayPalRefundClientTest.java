package com.modula.payment.service;

import com.modula.payment.config.PayPalProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PayPalRefundClientTest {

    private RestTemplate restTemplate;
    private PayPalClient payPalClient;
    private PayPalRefundClient refundClient;

    @BeforeEach
    void setUp() {
        PayPalProperties props = new PayPalProperties();
        props.setClientId("id");
        props.setClientSecret("secret");
        props.setMode("sandbox");

        restTemplate = mock(RestTemplate.class);
        payPalClient = mock(PayPalClient.class);
        when(payPalClient.getAccessToken()).thenReturn("test-token");

        refundClient = new PayPalRefundClient(props, restTemplate, payPalClient);
    }

    @Test
    void refund_callsCorrectPayPalEndpoint_returnsRefundIdAndStatus() {
        Map<String, Object> response = Map.of("id", "REFUND-XYZ", "status", "COMPLETED");
        when(restTemplate.exchange(contains("/refund"), eq(HttpMethod.POST),
                any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(response));

        var result = refundClient.refund("CAPTURE-001", new BigDecimal("30.00"));

        assertThat(result.refundId()).isEqualTo("REFUND-XYZ");
        assertThat(result.status()).isEqualTo("COMPLETED");
        verify(restTemplate).exchange(
                contains("/captures/CAPTURE-001/refund"),
                eq(HttpMethod.POST), any(), eq(Map.class));
    }

    @Test
    void refund_onPayPalError_throwsPayPalException_noDoubleRefund() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenThrow(new RestClientException("PayPal rejected"));

        assertThatThrownBy(() ->
                refundClient.refund("CAPTURE-X", BigDecimal.TEN))
                .isInstanceOf(PayPalClient.PayPalException.class)
                .hasMessageContaining("Failed to execute PayPal refund");
    }
}
