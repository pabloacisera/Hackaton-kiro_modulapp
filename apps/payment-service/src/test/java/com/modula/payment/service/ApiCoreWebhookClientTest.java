package com.modula.payment.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ApiCoreWebhookClientTest {

    private RestTemplate restTemplate;
    private ApiCoreWebhookClient client;

    @BeforeEach
    void setUp() {
        restTemplate = mock(RestTemplate.class);
        client = new ApiCoreWebhookClient(restTemplate);
        ReflectionTestUtils.setField(client, "apiCoreBaseUrl", "http://api-core:8080");
    }

    @Test
    void notifyPaymentResult_sendsPostToCorrectUrl_withCorrectPayload() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class)))
                .thenReturn(ResponseEntity.ok().build());

        client.notifyPaymentResult("ref-001", "confirmed", "pay-uuid");

        verify(restTemplate).exchange(
                eq("http://api-core:8080/orders/webhooks/payment-result"),
                eq(HttpMethod.POST),
                argThat(entity -> {
                    @SuppressWarnings("unchecked")
                    var body = (java.util.Map<String, String>) entity.getBody();
                    return "ref-001".equals(body.get("reference_id"))
                        && "confirmed".equals(body.get("status"));
                }),
                eq(Void.class)
        );
    }

    @Test
    void notifyPaymentResult_onRestClientException_propagatesForRetry() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(Void.class)))
                .thenThrow(new RestClientException("connection refused"));

        // @Retryable is not active in unit test context — just verify exception is thrown
        assertThatThrownBy(() -> client.notifyPaymentResult("ref", "failed", "uuid"))
                .isInstanceOf(RestClientException.class);
    }
}
