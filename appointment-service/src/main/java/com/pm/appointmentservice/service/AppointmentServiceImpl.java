package com.pm.appointmentservice.service;

import com.pm.appointmentservice.client.NotificationClient;
import com.pm.appointmentservice.client.PaymentClient;
import com.pm.appointmentservice.entity.Appointment;
import com.pm.appointmentservice.entity.SagaState;
import com.pm.appointmentservice.exception.PaymentFailedException;
import com.pm.appointmentservice.exception.ResourceNotFoundException;
import com.pm.appointmentservice.kafka.AppointmentKafkaProducer;
import com.pm.appointmentservice.repository.AppointmentRepository;
import com.pm.appointmentservice.repository.SagaStateRepository;
import notification.NotificationResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import payment.PaymentResponse;

import java.util.List;
import java.util.UUID;

@Service
public class AppointmentServiceImpl implements AppointmentService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentServiceImpl.class);

    private final AppointmentRepository appointmentRepository;
    private final SagaStateRepository sagaStateRepository;
    private final PaymentClient paymentClient;
    private final NotificationClient notificationClient;
    private final AppointmentKafkaProducer kafkaProducer;

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository,
                                  SagaStateRepository sagaStateRepository,
                                  PaymentClient paymentClient,
                                  NotificationClient notificationClient,
                                  AppointmentKafkaProducer kafkaProducer) {
        this.appointmentRepository = appointmentRepository;
        this.sagaStateRepository = sagaStateRepository;
        this.paymentClient = paymentClient;
        this.notificationClient = notificationClient;
        this.kafkaProducer = kafkaProducer;
    }

    @Override
    @Transactional(noRollbackFor = PaymentFailedException.class)
    public Appointment createAppointment(Appointment appointment) {
        log.info("Starting saga: Create appointment for patientId={}, doctorId={}, amount={}",
                appointment.getPatientId(), appointment.getDoctorId(), appointment.getAmount());

        appointment.setStatus("PENDING");
        Appointment savedAppointment = appointmentRepository.save(appointment);
        String appointmentIdStr = savedAppointment.getId().toString();

        // 1. Record SagaState for PAYMENT step
        SagaState paymentSagaState = new SagaState();
        paymentSagaState.setAppointmentId(appointmentIdStr);
        paymentSagaState.setStep("PAYMENT");
        paymentSagaState.setStatus("PENDING");
        paymentSagaState = sagaStateRepository.save(paymentSagaState);

        // 2. Call Payment Service via gRPC
        PaymentResponse paymentResponse = paymentClient.processPayment(
                appointmentIdStr,
                savedAppointment.getPatientId(),
                savedAppointment.getAmount()
        );

        // 3. Process payment response
        if ("COMPLETED".equals(paymentResponse.getStatus())) {
            log.info("Payment succeeded for appointmentId={}. paymentId={}", appointmentIdStr, paymentResponse.getPaymentId());

            paymentSagaState.setStatus("SUCCESS");
            paymentSagaState.setCompensationData(paymentResponse.getPaymentId());
            sagaStateRepository.save(paymentSagaState);

            savedAppointment.setStatus("CONFIRMED");
            savedAppointment = appointmentRepository.save(savedAppointment);

            // Call Notification Service via gRPC (confirmation)
            String messageText = String.format("Dear patient, your appointment with doctor %s on %s is confirmed. Amount charged: $%s. Payment ID: %s.",
                    savedAppointment.getDoctorId(), savedAppointment.getSlotDatetime(), savedAppointment.getAmount(), paymentResponse.getPaymentId());

            SagaState notificationSagaState = new SagaState();
            notificationSagaState.setAppointmentId(appointmentIdStr);
            notificationSagaState.setStep("NOTIFICATION");
            notificationSagaState.setStatus("PENDING");
            notificationSagaState = sagaStateRepository.save(notificationSagaState);

            NotificationResponse notificationResponse = notificationClient.sendConfirmation(
                    savedAppointment.getPatientId(),
                    appointmentIdStr,
                    messageText
            );

            if ("SENT".equals(notificationResponse.getStatus())) {
                log.info("Notification sent successfully for appointmentId={}", appointmentIdStr);
                notificationSagaState.setStatus("SUCCESS");
            } else {
                log.warn("Notification failed for appointmentId={}: {}", appointmentIdStr, notificationResponse.getErrorMessage());
                notificationSagaState.setStatus("FAILED");
                notificationSagaState.setCompensationData(notificationResponse.getErrorMessage());
            }
            sagaStateRepository.save(notificationSagaState);

            // Publish appointment.created event to Kafka
            kafkaProducer.sendAppointmentEvent(
                    "appointment.created",
                    appointmentIdStr,
                    savedAppointment.getPatientId(),
                    savedAppointment.getDoctorId(),
                    savedAppointment.getSlotDatetime(),
                    "APPOINTMENT_CREATED"
            );

            return savedAppointment;
        } else {
            String errorMsg = paymentResponse.getErrorMessage();
            log.warn("Payment failed for appointmentId={}. Reason: {}", appointmentIdStr, errorMsg);

            paymentSagaState.setStatus("FAILED");
            paymentSagaState.setCompensationData(errorMsg);
            sagaStateRepository.save(paymentSagaState);

            savedAppointment.setStatus("CANCELLED");
            savedAppointment = appointmentRepository.save(savedAppointment);

            // Invoke Notification Service to send payment failure notice
            String failureMessage = String.format("Your appointment booking on %s failed due to: %s",
                    savedAppointment.getSlotDatetime(), errorMsg);
            notificationClient.sendPaymentFailureNotice(
                    savedAppointment.getPatientId(),
                    errorMsg,
                    failureMessage
            );

            // Publish appointment.cancelled event to Kafka
            kafkaProducer.sendAppointmentEvent(
                    "appointment.cancelled",
                    appointmentIdStr,
                    savedAppointment.getPatientId(),
                    savedAppointment.getDoctorId(),
                    savedAppointment.getSlotDatetime(),
                    "APPOINTMENT_CANCELLED"
            );

            throw new PaymentFailedException("Appointment booking failed: " + errorMsg);
        }
    }

    @Override
    public Appointment getAppointment(UUID id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
    }

    @Override
    public List<Appointment> getAppointmentsByPatient(String patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }
}
