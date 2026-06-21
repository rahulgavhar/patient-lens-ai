package com.pm.analyticsservice.kafka;

import com.google.protobuf.InvalidProtocolBufferException;
import com.pm.analyticsservice.model.PatientAnalytics;
import com.pm.analyticsservice.repository.PatientAnalyticsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import patient.events.PatientEvent;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class KafkaConsumer {
    private static final Logger log = LoggerFactory.getLogger(KafkaConsumer.class);

    private final PatientAnalyticsRepository analyticsRepository;

    public KafkaConsumer(PatientAnalyticsRepository analyticsRepository) {
        this.analyticsRepository = analyticsRepository;
    }

    @KafkaListener(topics = "patient", groupId = "analytics-service")
    public void consumeEvent(byte[] event) {
        try {
            PatientEvent patientEvent = PatientEvent.parseFrom(event);
            log.info("Received patient event: ID={}, Name={}, EventType={}", 
                    patientEvent.getPatientId(), patientEvent.getName(), patientEvent.getEventType());

            UUID patientId = UUID.fromString(patientEvent.getPatientId());
            String eventType = patientEvent.getEventType();

            if ("PATIENT_DELETED".equals(eventType)) {
                analyticsRepository.deleteById(patientId);
                log.info("Deleted patient from analytics DB: {}", patientId);
                return;
            }

            Optional<PatientAnalytics> optionalAnalytics = analyticsRepository.findById(patientId);
            PatientAnalytics record;

            if (optionalAnalytics.isPresent()) {
                record = optionalAnalytics.get();
                record.setName(patientEvent.getName());
                record.setEmail(patientEvent.getEmail());
                record.incrementEventCount();
            } else {
                record = new PatientAnalytics(patientId, patientEvent.getName(), patientEvent.getEmail());
            }

            if (patientEvent.getBloodGroup() != null && !patientEvent.getBloodGroup().isEmpty()) {
                record.setBloodGroup(patientEvent.getBloodGroup());
            }
            if (patientEvent.getHeight() > 0) {
                record.setHeight(patientEvent.getHeight());
            }
            if (patientEvent.getWeight() > 0) {
                record.setWeight(patientEvent.getWeight());
            }
            
            record.setLastUpdated(LocalDateTime.now());
            analyticsRepository.save(record);
            log.info("Saved patient analytics record in DB: name={}, updates={}", record.getName(), record.getEventCount());

        } catch (InvalidProtocolBufferException e) {
            log.error("Failed to parse patient event: {}", e.getMessage());
        }
    }
}
