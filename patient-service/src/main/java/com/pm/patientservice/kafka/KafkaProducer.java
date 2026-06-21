package com.pm.patientservice.kafka;

import com.pm.patientservice.model.Patient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import patient.events.PatientEvent;

import java.time.Instant;

@Service
public class KafkaProducer {

    private static final Logger log = LoggerFactory.getLogger(KafkaProducer.class);

    private final KafkaTemplate<String, byte[]> kafkaTemplate;

    public KafkaProducer(KafkaTemplate<String, byte[]> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Sends a generic patient event to Kafka
     * @param patient Patient object
     * @param eventType Event type: PATIENT_CREATED, PATIENT_UPDATED, etc.
     */
    public void sendEvent(Patient patient, String eventType) {
        PatientEvent event = PatientEvent.newBuilder()
                .setPatientId(patient.getId().toString())
                .setName(patient.getName())
                .setEmail(patient.getEmail())
                .setEventType(eventType)
                .setTimestamp(Instant.now().toEpochMilli())
                .setBloodGroup(patient.getBloodGroup() != null ? patient.getBloodGroup() : "")
                .setHeight(patient.getHeight() != null ? patient.getHeight() : 0.0)
                .setWeight(patient.getWeight() != null ? patient.getWeight() : 0.0)
                .build();

        try {
            kafkaTemplate.send("patient", event.toByteArray());
            log.info("Sent patient event '{}' for patientId={}", eventType, patient.getId());
        } catch (Exception e) {
            log.error("Failed to send patient event '{}' for patientId={}", eventType, patient.getId(), e);
        }
    }

    // Convenience methods for common events
    public void sendPatientCreated(Patient patient) {
        sendEvent(patient, "PATIENT_CREATED");
    }

    public void sendPatientUpdated(Patient patient) {
        sendEvent(patient, "PATIENT_UPDATED");
    }

    public void sendPatientDeleted(Patient patient) {
        sendEvent(patient, "PATIENT_DELETED");
    }

    public void sendPatientHealthUpdated(Patient patient) {
        sendEvent(patient, "PATIENT_HEALTH_UPDATED");
    }
}