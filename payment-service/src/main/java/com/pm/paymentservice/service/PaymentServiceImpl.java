package com.pm.paymentservice.service;

import com.pm.paymentservice.kafka.PaymentKafkaProducer;
import com.pm.paymentservice.model.Payment;
import com.pm.paymentservice.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import payment.PaymentRequest;
import payment.PaymentResponse;
import payment.RefundRequest;
import payment.RefundResponse;

import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentRepository paymentRepository;
    private final PaymentKafkaProducer kafkaProducer;

    public PaymentServiceImpl(PaymentRepository paymentRepository, PaymentKafkaProducer kafkaProducer) {
        this.paymentRepository = paymentRepository;
        this.kafkaProducer = kafkaProducer;
    }

    @Override
    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        log.info("Processing payment for appointmentId={}, patientId={}, amount={}",
                request.getAppointmentId(), request.getPatientId(), request.getAmount());

        Payment payment = new Payment();
        payment.setAppointmentId(request.getAppointmentId());
        payment.setPatientId(request.getPatientId());
        payment.setAmount(request.getAmount());

        // Simple mock rule: fail if amount is 999.0 or patientId contains "fail"
        boolean shouldFail = request.getAmount() == 999.0 || request.getPatientId().toLowerCase().contains("fail");

        if (shouldFail) {
            payment.setStatus("FAILED");
            payment.setErrorMessage("Insufficient funds or mock payment failure triggered");
            payment = paymentRepository.save(payment);

            log.warn("Payment failed for appointmentId={}. Saving record.", request.getAppointmentId());

            // Publish failure event to "payment.failed"
            kafkaProducer.sendPaymentEvent("payment.failed",
                    payment.getId().toString(),
                    payment.getAppointmentId(),
                    payment.getPatientId(),
                    payment.getAmount(),
                    "PAYMENT_FAILED");

            return PaymentResponse.newBuilder()
                    .setPaymentId(payment.getId().toString())
                    .setStatus("FAILED")
                    .setErrorMessage(payment.getErrorMessage())
                    .build();
        } else {
            payment.setStatus("COMPLETED");
            payment.setGatewayTransactionId("TXN-" + UUID.randomUUID());
            payment = paymentRepository.save(payment);

            log.info("Payment completed for appointmentId={}, txnId={}",
                    request.getAppointmentId(), payment.getGatewayTransactionId());

            // Publish completed event to "payment.completed"
            kafkaProducer.sendPaymentEvent("payment.completed",
                    payment.getId().toString(),
                    payment.getAppointmentId(),
                    payment.getPatientId(),
                    payment.getAmount(),
                    "PAYMENT_COMPLETED");

            return PaymentResponse.newBuilder()
                    .setPaymentId(payment.getId().toString())
                    .setStatus("COMPLETED")
                    .setGatewayTransactionId(payment.getGatewayTransactionId())
                    .build();
        }
    }

    @Override
    @Transactional
    public RefundResponse refundPayment(RefundRequest request) {
        log.info("Processing refund for paymentId={}, appointmentId={}",
                request.getPaymentId(), request.getAppointmentId());

        Optional<Payment> optionalPayment = Optional.empty();
        try {
            UUID paymentUuid = UUID.fromString(request.getPaymentId());
            optionalPayment = paymentRepository.findById(paymentUuid);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid paymentId UUID format: {}", request.getPaymentId());
        }

        if (optionalPayment.isEmpty()) {
            // fallback lookup by appointmentId
            optionalPayment = paymentRepository.findByAppointmentId(request.getAppointmentId());
        }

        if (optionalPayment.isPresent()) {
            Payment payment = optionalPayment.get();
            payment.setStatus("REFUNDED");
            paymentRepository.save(payment);

            log.info("Payment refunded successfully for paymentId={}", payment.getId());

            // Publish refund/failed event to Kafka
            kafkaProducer.sendPaymentEvent("payment.failed",
                    payment.getId().toString(),
                    payment.getAppointmentId(),
                    payment.getPatientId(),
                    payment.getAmount(),
                    "PAYMENT_REFUNDED");

            return RefundResponse.newBuilder()
                    .setStatus("REFUNDED")
                    .build();
        } else {
            log.error("Refund failed. Payment record not found for paymentId={}, appointmentId={}",
                    request.getPaymentId(), request.getAppointmentId());

            return RefundResponse.newBuilder()
                    .setStatus("FAILED")
                    .setErrorMessage("Payment record not found")
                    .build();
        }
    }
}
