package com.pm.notificationservice.kafka;

import appointment.events.AppointmentEvent;
import com.pm.notificationservice.client.PatientClient;
import com.pm.notificationservice.model.Notification;
import com.pm.notificationservice.repository.NotificationRepository;
import com.pm.notificationservice.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import payment.events.PaymentEvent;

import java.util.Map;

@Component
public class NotificationKafkaConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationKafkaConsumer.class);

    private final NotificationRepository notificationRepository;
    private final PatientClient patientClient;
    private final EmailService emailService;

    public NotificationKafkaConsumer(NotificationRepository notificationRepository, 
                                     PatientClient patientClient, 
                                     EmailService emailService) {
        this.notificationRepository = notificationRepository;
        this.patientClient = patientClient;
        this.emailService = emailService;
    }

    @KafkaListener(topics = "appointment.created", groupId = "notification-service-group")
    public void consumeAppointmentCreated(byte[] message) {
        try {
            AppointmentEvent event = AppointmentEvent.parseFrom(message);
            log.info("Received appointment.created event: appointmentId={}, patientId={}",
                    event.getAppointmentId(), event.getPatientId());

            String patientName = "Valued Patient";
            String patientEmail = null;

            // Fetch patient email from patient-service
            Map<String, Object> patient = patientClient.getPatient(event.getPatientId());
            if (patient != null) {
                if (patient.containsKey("name")) patientName = (String) patient.get("name");
                if (patient.containsKey("email")) patientEmail = (String) patient.get("email");
            }

            String msgContent = String.format("Appointment booked successfully. Id: %s, Doctor: %s, Time: %s",
                    event.getAppointmentId(), event.getDoctorId(), event.getSlotDatetime());

            Notification notification = new Notification();
            notification.setPatientId(event.getPatientId());
            notification.setAppointmentId(event.getAppointmentId());
            notification.setType("APPOINTMENT_CREATED");
            notification.setStatus("SENT");
            notification.setMessage(msgContent);
            notificationRepository.save(notification);

            if (patientEmail != null && !patientEmail.isBlank()) {
                String subject = "Appointment Booked Successfully - PatientLens AI";
                String body = String.format(
                        "Dear %s,\n\n" +
                        "Your appointment has been booked successfully!\n\n" +
                        "Appointment Details:\n" +
                        "- Appointment ID: %s\n" +
                        "- Doctor ID: %s\n" +
                        "- Scheduled Time: %s\n\n" +
                        "Thank you for choosing PatientLens AI.\n\n" +
                        "Best regards,\n" +
                        "PatientLens AI Medical Team",
                        patientName, event.getAppointmentId(), event.getDoctorId(), event.getSlotDatetime()
                );
                emailService.sendEmail(patientEmail, subject, body);
            } else {
                log.warn("No email address found for patientId: {}. Skipping email delivery.", event.getPatientId());
            }

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

            String patientName = "Valued Patient";
            String patientEmail = null;

            Map<String, Object> patient = patientClient.getPatient(event.getPatientId());
            if (patient != null) {
                if (patient.containsKey("name")) patientName = (String) patient.get("name");
                if (patient.containsKey("email")) patientEmail = (String) patient.get("email");
            }

            String msgContent = String.format("Appointment cancelled. Id: %s, Doctor: %s",
                    event.getAppointmentId(), event.getDoctorId());

            Notification notification = new Notification();
            notification.setPatientId(event.getPatientId());
            notification.setAppointmentId(event.getAppointmentId());
            notification.setType("APPOINTMENT_CANCELLED");
            notification.setStatus("SENT");
            notification.setMessage(msgContent);
            notificationRepository.save(notification);

            if (patientEmail != null && !patientEmail.isBlank()) {
                String subject = "Appointment Cancellation Alert - PatientLens AI";
                String body = String.format(
                        "Dear %s,\n\n" +
                        "This email is to confirm that your appointment has been cancelled.\n\n" +
                        "Appointment Details:\n" +
                        "- Appointment ID: %s\n" +
                        "- Doctor ID: %s\n\n" +
                        "If this was in error, please book a new slot through your Patient Portal.\n\n" +
                        "Best regards,\n" +
                        "PatientLens AI Medical Team",
                        patientName, event.getAppointmentId(), event.getDoctorId()
                );
                emailService.sendEmail(patientEmail, subject, body);
            }

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

            String patientName = "Valued Patient";
            String patientEmail = null;

            Map<String, Object> patient = patientClient.getPatient(event.getPatientId());
            if (patient != null) {
                if (patient.containsKey("name")) patientName = (String) patient.get("name");
                if (patient.containsKey("email")) patientEmail = (String) patient.get("email");
            }

            String msgContent = String.format("Payment completed. PaymentId: %s, Amount: %s, Status: %s",
                    event.getPaymentId(), event.getAmount(), event.getStatus());

            Notification notification = new Notification();
            notification.setPatientId(event.getPatientId());
            notification.setAppointmentId(event.getAppointmentId());
            notification.setType("PAYMENT_COMPLETED");
            notification.setStatus("SENT");
            notification.setMessage(msgContent);
            notificationRepository.save(notification);

            if (patientEmail != null && !patientEmail.isBlank()) {
                String subject = "Invoice Payment Receipt - PatientLens AI";
                String body = String.format(
                        "Dear %s,\n\n" +
                        "Thank you for your payment. Your transaction has cleared successfully.\n\n" +
                        "Payment Details:\n" +
                        "- Transaction ID: %s\n" +
                        "- Appointment Ref: %s\n" +
                        "- Amount Paid: $%s\n" +
                        "- Status: %s\n\n" +
                        "A full copy of your invoice is available in your Billing Portal.\n\n" +
                        "Best regards,\n" +
                        "PatientLens AI Billing Division",
                        patientName, event.getPaymentId(), event.getAppointmentId(), event.getAmount(), event.getStatus()
                );
                emailService.sendEmail(patientEmail, subject, body);
            }

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

            String patientName = "Valued Patient";
            String patientEmail = null;

            Map<String, Object> patient = patientClient.getPatient(event.getPatientId());
            if (patient != null) {
                if (patient.containsKey("name")) patientName = (String) patient.get("name");
                if (patient.containsKey("email")) patientEmail = (String) patient.get("email");
            }

            String msgContent = String.format("Payment failed or refunded. PaymentId: %s, Amount: %s, Status: %s",
                    event.getPaymentId(), event.getAmount(), event.getStatus());

            Notification notification = new Notification();
            notification.setPatientId(event.getPatientId());
            notification.setAppointmentId(event.getAppointmentId());
            notification.setType("PAYMENT_FAILED");
            notification.setStatus("SENT");
            notification.setMessage(msgContent);
            notificationRepository.save(notification);

            if (patientEmail != null && !patientEmail.isBlank()) {
                String subject = "Payment Transaction Alert - PatientLens AI";
                String body = String.format(
                        "Dear %s,\n\n" +
                        "Your payment transaction has failed or been refunded.\n\n" +
                        "Payment Details:\n" +
                        "- Transaction ID: %s\n" +
                        "- Appointment Ref: %s\n" +
                        "- Amount: $%s\n" +
                        "- Status: %s\n\n" +
                        "Please verify your billing details or contact support in case of discrepancies.\n\n" +
                        "Best regards,\n" +
                        "PatientLens AI Billing Division",
                        patientName, event.getPaymentId(), event.getAppointmentId(), event.getAmount(), event.getStatus()
                );
                emailService.sendEmail(patientEmail, subject, body);
            }

        } catch (Exception e) {
            log.error("Error processing payment.failed Kafka message", e);
        }
    }
}
