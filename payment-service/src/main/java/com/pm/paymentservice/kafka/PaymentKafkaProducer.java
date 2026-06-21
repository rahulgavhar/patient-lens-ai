package com.pm.paymentservice.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import payment.events.PaymentEvent;

import java.time.Instant;

@Component
public class PaymentKafkaProducer {

    private static final Logger log = LoggerFactory.getLogger(PaymentKafkaProducer.class);

    private final KafkaTemplate<String, byte[]> kafkaTemplate;

    public PaymentKafkaProducer(KafkaTemplate<String, byte[]> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendPaymentEvent(String topic, String paymentId, String appointmentId, String patientId, double amount, String status) {
        PaymentEvent event = PaymentEvent.newBuilder()
                .setPaymentId(paymentId)
                .setAppointmentId(appointmentId)
                .setPatientId(patientId)
                .setAmount(amount)
                .setStatus(status)
                .setTimestamp(Instant.now().toEpochMilli())
                .build();

        try {
            kafkaTemplate.send(topic, event.toByteArray());
            log.info("Successfully sent PaymentEvent to topic '{}': paymentId={}, status={}", topic, paymentId, status);
        } catch (Exception e) {
            log.error("Failed to send PaymentEvent to topic '{}': paymentId={}", topic, paymentId, e);
        }
    }
}
