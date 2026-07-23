package com.modula.payment.controller;

import com.modula.payment.service.WebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * TASK-pay-7: Receives PayPal webhook events.
 * PayPal sends events as POST requests with signature headers.
 */
@RestController
@RequestMapping("/payments/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final WebhookService webhookService;

    @PostMapping("/paypal")
    public ResponseEntity<Void> receive(
            @RequestHeader(value = "Paypal-Transmission-Id",  required = false) String eventId,
            @RequestHeader(value = "Paypal-Transmission-Sig", required = false) String sig,
            @RequestBody Map<String, Object> body) {

        String eventType = (String) body.get("event_type");
        @SuppressWarnings("unchecked")
        Map<String, Object> resource = (Map<String, Object>) body.get("resource");

        webhookService.process(
                eventId   != null ? eventId   : "",
                sig       != null ? sig       : "",
                eventType != null ? eventType : "",
                resource  != null ? resource  : Map.of()
        );

        return ResponseEntity.ok().build();
    }
}
