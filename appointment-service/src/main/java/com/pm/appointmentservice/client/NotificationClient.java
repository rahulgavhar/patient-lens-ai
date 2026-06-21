package com.pm.appointmentservice.client;

import net.devh.boot.grpc.client.inject.GrpcClient;
import notification.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class NotificationClient {

    private static final Logger log = LoggerFactory.getLogger(NotificationClient.class);

    @GrpcClient("notification-service")
    private NotificationServiceGrpc.NotificationServiceBlockingStub notificationStub;

    public NotificationResponse sendConfirmation(String patientId, String appointmentId, String message) {
        log.info("Invoking NotificationService sendConfirmation gRPC for patientId={}, appointmentId={}",
                patientId, appointmentId);
        ConfirmationRequest request = ConfirmationRequest.newBuilder()
                .setPatientId(patientId)
                .setAppointmentId(appointmentId)
                .setMessage(message)
                .build();

        try {
            return notificationStub.sendConfirmation(request);
        } catch (Exception e) {
            log.error("Failed to invoke SendConfirmation gRPC service for patientId={}", patientId, e);
            return NotificationResponse.newBuilder()
                    .setStatus("FAILED")
                    .setErrorMessage(e.getMessage() != null ? e.getMessage() : "gRPC call failed")
                    .build();
        }
    }

    public NotificationResponse sendPaymentFailureNotice(String patientId, String reason, String message) {
        log.info("Invoking NotificationService sendPaymentFailureNotice gRPC for patientId={}, reason={}",
                patientId, reason);
        NoticeRequest request = NoticeRequest.newBuilder()
                .setPatientId(patientId)
                .setReason(reason)
                .setMessage(message)
                .build();

        try {
            return notificationStub.sendPaymentFailureNotice(request);
        } catch (Exception e) {
            log.error("Failed to invoke SendPaymentFailureNotice gRPC service for patientId={}", patientId, e);
            return NotificationResponse.newBuilder()
                    .setStatus("FAILED")
                    .setErrorMessage(e.getMessage() != null ? e.getMessage() : "gRPC call failed")
                    .build();
        }
    }
}
