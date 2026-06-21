package com.pm.notificationservice.kafka;

import appointment.events.AppointmentEvent;
import com.pm.notificationservice.model.Notification;
import com.pm.notificationservice.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import payment.events.PaymentEvent;

@Component
public class NotificationKafkaConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationKafkaConsumer.class);

    private final NotificationRepository notificationRepository;

    public NotificationKafkaConsumer(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @KafkaListener(topics = "appointment.created", groupId = "notification-service-group")
    public void consumeAppointmentCreated(byte[] message) {
        try {
            AppointmentEvent event = AppointmentEvent.parseFrom(message);
            log.info("Received appointment.created event: appointmentId={}, patientId={}",
                    event.getAppointmentId(), event.getPatientId());

            Notification notification = new Notification();
            notification.setPatientId(event.getPatientId());
            notification.setAppointmentId(event.getAppointmentId());
            notification.setType("APPOINTMENT_CREATED");
            notification.setStatus("SENT");
            notification.setMessage(String.format("Appointment booked successfully. Id: %s, Doctor: %s, Time: %s",
                    event.getAppointmentId(), event.getDoctorId(), event.getSlotDatetime()));

            notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Error processing appointment.created Kafka message", e);
        }
    }

    @KafkaListener(topics = "appointment.cancelled", groupId = "notification-service-group")
    public void consumeAppointmentCancelled(byte[] message) {
        try {
            AppointmentEvent event = AppointmentEvent.parseFrom(message);
            log.info("Received appointment.cancelled event: appointmentId={}, patientId={}",
                    event.getAppointmentId(), event.getPatientId());

            Notification notification = new Notification();
            notification.setPatientId(event.getPatientId());
            notification.setAppointmentId(event.getAppointmentId());
            notification.setType("APPOINTMENT_CANCELLED");
            notification.setStatus("SENT");
            notification.setMessage(String.format("Appointment cancelled. Id: %s, Doctor: %s",
                    event.getAppointmentId(), event.getDoctorId()));

            notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Error processing appointment.cancelled Kafka message", e);
        }
    }

    @KafkaListener(topics = "payment.completed", groupId = "notification-service-group")
    public void consumePaymentCompleted(byte[] message) {
        try {
            PaymentEvent event = PaymentEvent.parseFrom(message);
            log.info("Received payment.completed event: paymentId={}, appointmentId={}",
                    event.getPaymentId(), event.getAppointmentId());

            Notification notification = new Notification();
            notification.setPatientId(event.getPatientId());
            notification.setAppointmentId(event.getAppointmentId());
            notification.setType("PAYMENT_COMPLETED");
            notification.setStatus("SENT");
            notification.setMessage(String.format("Payment completed. PaymentId: %s, Amount: %s, Status: %s",
                    event.getPaymentId(), event.getAmount(), event.getStatus()));

            notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Error processing payment.completed Kafka message", e);
        }
    }

    @KafkaListener(topics = "payment.failed", groupId = "notification-service-group")
    public void consumePaymentFailed(byte[] message) {
        try {
            PaymentEvent event = PaymentEvent.parseFrom(message);
            log.info("Received payment.failed event: paymentId={}, appointmentId={}",
                    event.getPaymentId(), event.getAppointmentId());

            Notification notification = new Notification();
            notification.setPatientId(event.getPatientId());
            notification.setAppointmentId(event.getAppointmentId());
            notification.setType("PAYMENT_FAILED");
            notification.setStatus("SENT");
            notification.setMessage(String.format("Payment failed or refunded. PaymentId: %s, Amount: %s, Status: %s",
                    event.getPaymentId(), event.getAmount(), event.getStatus()));

            notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Error processing payment.failed Kafka message", e);
        }
    }
}
