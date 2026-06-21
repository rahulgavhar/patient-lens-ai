package com.pm.appointmentservice.client;

import net.devh.boot.grpc.client.inject.GrpcClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import payment.*;

@Component
public class PaymentClient {

    private static final Logger log = LoggerFactory.getLogger(PaymentClient.class);

    @GrpcClient("payment-service")
    private PaymentServiceGrpc.PaymentServiceBlockingStub paymentStub;

    public PaymentResponse processPayment(String appointmentId, String patientId, double amount) {
        log.info("Invoking PaymentService gRPC for appointmentId={}, patientId={}, amount={}",
                appointmentId, patientId, amount);
        PaymentRequest request = PaymentRequest.newBuilder()
                .setAppointmentId(appointmentId)
                .setPatientId(patientId)
                .setAmount(amount)
                .setCurrency("USD")
                .build();

        try {
            return paymentStub.processPayment(request);
        } catch (Exception e) {
            log.error("Failed to invoke ProcessPayment gRPC service for appointmentId={}", appointmentId, e);
            return PaymentResponse.newBuilder()
                    .setStatus("FAILED")
                    .setErrorMessage(e.getMessage() != null ? e.getMessage() : "gRPC call failed")
                    .build();
        }
    }

    public RefundResponse refundPayment(String paymentId, String appointmentId) {
        log.info("Invoking PaymentService Refund Payment gRPC for paymentId={}, appointmentId={}",
                paymentId, appointmentId);
        RefundRequest request = RefundRequest.newBuilder()
                .setPaymentId(paymentId)
                .setAppointmentId(appointmentId)
                .build();

        try {
            return paymentStub.refundPayment(request);
        } catch (Exception e) {
            log.error("Failed to invoke RefundPayment gRPC service for paymentId={}", paymentId, e);
            return RefundResponse.newBuilder()
                    .setStatus("FAILED")
                    .setErrorMessage(e.getMessage() != null ? e.getMessage() : "gRPC call failed")
                    .build();
        }
    }
}
