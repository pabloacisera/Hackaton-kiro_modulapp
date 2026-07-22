package com.modula.payment.repository;

import com.modula.payment.domain.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefundRepository extends JpaRepository<Refund, UUID> {

    Optional<Refund> findByRefundRequestId(String refundRequestId);

    Optional<Refund> findByPaymentReferenceIdAndRefundRequestId(
            String referenceId, String refundRequestId);
}
