package com.modula.payment.service;

import com.modula.payment.domain.Receipt;
import com.modula.payment.repository.ReceiptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * TASK-pay-10: Sends transactional receipt emails via Mailjet API v3.1.
 *
 * <p>Uses Spring Retry for up to 3 attempts with exponential backoff.
 * Receipt is ALWAYS already persisted by the time this is called —
 * email failure does not affect receipt persistence.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final RestTemplate restTemplate;
    private final ReceiptRepository receiptRepository;

    @Value("${mailjet.api-key:}")       private String apiKey;
    @Value("${mailjet.api-secret:}")    private String apiSecret;
    @Value("${mailjet.from-email:}")    private String fromEmail;
    @Value("${mailjet.from-name:}")     private String fromName;

    private static final String MAILJET_URL =
            "https://api.mailjet.com/v3.1/send";

    /**
     * Sends the customer receipt PDF as an email attachment.
     * Retries up to 3 times with exponential backoff on any exception.
     * Updates {@link Receipt#getSentAt()} on success.
     */
    @Retryable(
        retryFor = Exception.class,
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public void sendReceiptEmail(Receipt receipt, String customerEmail) {
        if (apiKey == null || apiKey.isBlank() || apiSecret == null || apiSecret.isBlank()) {
            log.warn("Mailjet not configured — skipping receipt email to {}", customerEmail);
            return;
        }

        String pdfBase64 = receipt.getPdfUrl().contains("base64,")
                ? receipt.getPdfUrl().split("base64,")[1]
                : receipt.getPdfUrl();

        String subject = receipt.getRefund() != null
                ? "Your Modula refund receipt"
                : "Your Modula payment receipt";

        Map<String, Object> message = Map.of(
                "From",    Map.of("Email", fromEmail, "Name", fromName),
                "To",      List.of(Map.of("Email", customerEmail)),
                "Subject", subject,
                "HTMLPart", "<p>Please find your receipt attached.</p>",
                "Attachments", List.of(Map.of(
                        "ContentType",   "application/pdf",
                        "Filename",      "receipt.pdf",
                        "Base64Content", pdfBase64
                ))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String credentials = Base64.getEncoder()
                .encodeToString((apiKey + ":" + apiSecret).getBytes());
        headers.set("Authorization", "Basic " + credentials);

        try {
            restTemplate.exchange(
                    MAILJET_URL,
                    HttpMethod.POST,
                    new HttpEntity<>(Map.of("Messages", List.of(message)), headers),
                    Map.class
            );
            // Mark sent
            receipt.setSentAt(OffsetDateTime.now());
            receiptRepository.save(receipt);
            log.info("Receipt email sent to {}", customerEmail);
        } catch (RestClientException ex) {
            log.error("Email send failed (will retry): {}", ex.getMessage());
            throw ex; // trigger retry
        }
    }
}
