package com.pm.paymentservice.grpc;

import com.pm.paymentservice.service.PaymentService;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import payment.*;
import payment.PaymentServiceGrpc.PaymentServiceImplBase;

@GrpcService
public class PaymentGrpcService extends PaymentServiceImplBase {

    private static final Logger log = LoggerFactory.getLogger(PaymentGrpcService.class);

    private final PaymentService paymentService;

    public PaymentGrpcService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @Override
    public void processPayment(PaymentRequest request, StreamObserver<PaymentResponse> responseObserver) {
        try {
            log.info("gRPC processPayment request for appointmentId={}", request.getAppointmentId());
            PaymentResponse response = paymentService.processPayment(request);
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Failed to process payment via gRPC", e);
            PaymentResponse errorResponse = PaymentResponse.newBuilder()
                    .setStatus("FAILED")
                    .setErrorMessage(e.getMessage() != null ? e.getMessage() : "Internal Error")
                    .build();
            responseObserver.onNext(errorResponse);
            responseObserver.onCompleted();
        }
    }

    @Override
    public void refundPayment(RefundRequest request, StreamObserver<RefundResponse> responseObserver) {
        try {
            log.info("gRPC refundPayment request for paymentId={}", request.getPaymentId());
            RefundResponse response = paymentService.refundPayment(request);
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Failed to refund payment via gRPC", e);
            RefundResponse errorResponse = RefundResponse.newBuilder()
                    .setStatus("FAILED")
                    .setErrorMessage(e.getMessage() != null ? e.getMessage() : "Internal Error")
                    .build();
            responseObserver.onNext(errorResponse);
            responseObserver.onCompleted();
        }
    }
}
