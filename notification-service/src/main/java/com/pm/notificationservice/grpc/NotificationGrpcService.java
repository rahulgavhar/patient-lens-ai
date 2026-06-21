package com.pm.notificationservice.grpc;

import com.pm.notificationservice.model.Notification;
import com.pm.notificationservice.repository.NotificationRepository;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import notification.*;
import notification.NotificationServiceGrpc.NotificationServiceImplBase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@GrpcService
public class NotificationGrpcService extends NotificationServiceImplBase {

    private static final Logger log = LoggerFactory.getLogger(NotificationGrpcService.class);

    private final NotificationRepository notificationRepository;

    public NotificationGrpcService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    public void sendConfirmation(ConfirmationRequest request, StreamObserver<NotificationResponse> responseObserver) {
        try {
            log.info("Sending confirmation notification for patientId={}, appointmentId={}",
                    request.getPatientId(), request.getAppointmentId());

            Notification notification = new Notification();
            notification.setPatientId(request.getPatientId());
            notification.setAppointmentId(request.getAppointmentId());
            notification.setType("CONFIRMATION");
            notification.setStatus("SENT");
            notification.setMessage(request.getMessage());

            notification = notificationRepository.save(notification);

            NotificationResponse response = NotificationResponse.newBuilder()
                    .setNotificationId(notification.getId().toString())
                    .setStatus("SENT")
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Failed to send confirmation notification", e);
            NotificationResponse errorResponse = NotificationResponse.newBuilder()
                    .setStatus("FAILED")
                    .setErrorMessage(e.getMessage() != null ? e.getMessage() : "Internal Error")
                    .build();
            responseObserver.onNext(errorResponse);
            responseObserver.onCompleted();
        }
    }

    @Override
    public void sendPaymentFailureNotice(NoticeRequest request, StreamObserver<NotificationResponse> responseObserver) {
        try {
            log.info("Sending payment failure notification for patientId={}, reason={}",
                    request.getPatientId(), request.getReason());

            Notification notification = new Notification();
            notification.setPatientId(request.getPatientId());
            notification.setType("FAILURE");
            notification.setStatus("SENT");
            notification.setMessage("Payment Failed. Reason: " + request.getReason() + ". " + request.getMessage());

            notification = notificationRepository.save(notification);

            NotificationResponse response = NotificationResponse.newBuilder()
                    .setNotificationId(notification.getId().toString())
                    .setStatus("SENT")
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Failed to send payment failure notification", e);
            NotificationResponse errorResponse = NotificationResponse.newBuilder()
                    .setStatus("FAILED")
                    .setErrorMessage(e.getMessage() != null ? e.getMessage() : "Internal Error")
                    .build();
            responseObserver.onNext(errorResponse);
            responseObserver.onCompleted();
        }
    }
}
