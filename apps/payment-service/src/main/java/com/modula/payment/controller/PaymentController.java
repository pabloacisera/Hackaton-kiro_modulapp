package com.modula.payment.controller;

import com.modula.payment.domain.Payment.PaymentOrigin;
import com.modula.payment.domain.Receipt;
import com.modula.payment.repository.ReceiptRepository;
import com.modula.payment.service.PaymentService;
import com.modula.payment.service.PaymentService.PaymentInitResult;
import com.modula.payment.service.RefundService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final RefundService refundService;
    private final ReceiptRepository receiptRepository;

    // ── TASK-pay-6: Initiate payment ──────────────────────────────────────────

    @PostMapping("/orders")
    public ResponseEntity<Map<String, String>> initiatePayment(
            @Valid @RequestBody InitiatePaymentRequest req) {

        PaymentInitResult result = paymentService.initiatePayment(
                req.referenceId(),
                PaymentOrigin.valueOf(req.origin()),
                req.amountUsd(),
                req.customerEmail(),
                req.idempotencyKey()
        );

        Map<String, String> body = Map.of(
                "payment_link",       result.paymentLink() != null ? result.paymentLink() : "",
                "payment_service_ref", result.paymentServiceRef()
        );

        return result.created()
                ? ResponseEntity.status(HttpStatus.CREATED).body(body)
                : ResponseEntity.ok(body);
    }

    // ── TASK-pay-12: Execute refund ───────────────────────────────────────────

    @PostMapping("/orders/{ref}/refund")
    public ResponseEntity<Map<String, String>> refund(
            @PathVariable String ref,
            @Valid @RequestBody RefundRequest req) {

        var refund = refundService.refund(ref, req.reason(), req.refundRequestId());
        return ResponseEntity.ok(Map.of(
                "refund_id", refund.getId().toString(),
                "status",    refund.getStatus().name()
        ));
    }

    // ── TASK-pay-14: Get receipts ─────────────────────────────────────────────

    @GetMapping("/{ref}/receipt")
    public ResponseEntity<List<String>> getReceipt(@PathVariable String ref) {
        List<Receipt> receipts = receiptRepository.findByPaymentReferenceId(ref);
        if (receipts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "No receipts found for reference: " + ref);
        }
        List<String> urls = receipts.stream().map(Receipt::getPdfUrl).toList();
        return ResponseEntity.ok(urls);
    }

    // ── Request / response records ────────────────────────────────────────────

    public record InitiatePaymentRequest(
            @NotBlank String referenceId,
            @NotBlank String origin,          // "order" | "quote"
            @NotNull @Positive BigDecimal amountUsd,
            @NotBlank String customerEmail,
            @NotBlank String idempotencyKey
    ) {}

    public record RefundRequest(
            @NotBlank String reason,
            @NotBlank String refundRequestId
    ) {}
}
