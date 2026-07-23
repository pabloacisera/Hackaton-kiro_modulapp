package com.modula.payment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.modula.payment.domain.Payment.PaymentOrigin;
import com.modula.payment.domain.Refund;
import com.modula.payment.domain.Refund.RefundStatus;
import com.modula.payment.repository.ReceiptRepository;
import com.modula.payment.service.PaymentService;
import com.modula.payment.service.PaymentService.PaymentInitResult;
import com.modula.payment.service.RefundService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PaymentController.class)
class PaymentControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean PaymentService paymentService;
    @MockBean RefundService  refundService;
    @MockBean ReceiptRepository receiptRepository;

    // ── POST /payments/orders ─────────────────────────────────────────────────

    @Test
    void initiatePayment_newPayment_returns201WithPaymentLink() throws Exception {
        when(paymentService.initiatePayment(any(), any(), any(), any(), any()))
                .thenReturn(new PaymentInitResult(
                        "https://paypal.com/approve?token=ABC", "pay-uuid", true));

        String body = objectMapper.writeValueAsString(Map.of(
                "referenceId",    "order-1",
                "origin",         "order",
                "amountUsd",      99.99,
                "customerEmail",  "c@test.com",
                "idempotencyKey", "IDEM-1"
        ));

        mockMvc.perform(post("/payments/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.payment_link").value("https://paypal.com/approve?token=ABC"))
                .andExpect(jsonPath("$.payment_service_ref").value("pay-uuid"));
    }

    @Test
    void initiatePayment_existingIdempotencyKey_returns200() throws Exception {
        when(paymentService.initiatePayment(any(), any(), any(), any(), any()))
                .thenReturn(new PaymentInitResult(
                        "https://paypal.com/approve?token=XYZ", "pay-uuid-2", false));

        String body = objectMapper.writeValueAsString(Map.of(
                "referenceId", "order-2", "origin", "order",
                "amountUsd", 50.0, "customerEmail", "c@test.com",
                "idempotencyKey", "IDEM-EXISTING"
        ));

        mockMvc.perform(post("/payments/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    // ── GET /payments/:ref/receipt ────────────────────────────────────────────

    @Test
    void getReceipt_notFound_returns404() throws Exception {
        when(receiptRepository.findByPaymentReferenceId("missing"))
                .thenReturn(List.of());

        mockMvc.perform(get("/payments/missing/receipt"))
                .andExpect(status().isNotFound());
    }
}
