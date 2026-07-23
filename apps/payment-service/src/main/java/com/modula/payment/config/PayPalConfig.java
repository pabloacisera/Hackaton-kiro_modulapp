package com.modula.payment.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Configures a RestTemplate dedicated to PayPal API calls.
 * Timeouts are intentionally tight — financial ops must fail fast
 * rather than hold threads indefinitely.
 */
@Configuration
public class PayPalConfig {

    @Bean("paypalRestTemplate")
    public RestTemplate paypalRestTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(Duration.ofSeconds(10))
                .readTimeout(Duration.ofSeconds(30))
                .build();
    }
}
