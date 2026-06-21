package com.pm.appointmentservice.kafka;

import appointment.events.AppointmentEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class AppointmentKafkaProducer {

    private static final Logger log = LoggerFactory.getLogger(AppointmentKafkaProducer.class);

    private final KafkaTemplate<String, byte[]> kafkaTemplate;

    public AppointmentKafkaProducer(KafkaTemplate<String, byte[]> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendAppointmentEvent(String topic, String appointmentId, String patientId, String doctorId, String slotDatetime, String eventType) {
        AppointmentEvent event = AppointmentEvent.newBuilder()
                .setAppointmentId(appointmentId)
                .setPatientId(patientId)
                .setDoctorId(doctorId)
                .setSlotDatetime(slotDatetime)
                .setEventType(eventType)
                .setTimestamp(Instant.now().toEpochMilli())
                .build();

        try {
            kafkaTemplate.send(topic, event.toByteArray());
            log.info("Successfully sent AppointmentEvent to topic '{}': appointmentId={}, eventType={}", topic, appointmentId, eventType);
        } catch (Exception e) {
            log.error("Failed to send AppointmentEvent to topic '{}': appointmentId={}", topic, appointmentId, e);
        }
    }
}
