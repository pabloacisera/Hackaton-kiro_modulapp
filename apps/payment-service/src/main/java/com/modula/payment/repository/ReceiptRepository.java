package com.modula.payment.repository;

import com.modula.payment.domain.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReceiptRepository extends JpaRepository<Receipt, UUID> {

    List<Receipt> findByPaymentId(UUID paymentId);

    List<Receipt> findByRefundId(UUID refundId);

    List<Receipt> findByPaymentReferenceId(String referenceId);
}
