package com.pm.billingservice.kafka;

import com.pm.billingservice.model.Invoice;
import com.pm.billingservice.store.InvoiceStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import payment.events.PaymentEvent;

@Component
public class BillingKafkaConsumer {

    private static final Logger log = LoggerFactory.getLogger(BillingKafkaConsumer.class);

    private final InvoiceStore invoiceStore;

    public BillingKafkaConsumer(InvoiceStore invoiceStore) {
        this.invoiceStore = invoiceStore;
    }

    @KafkaListener(topics = "payment.completed", groupId = "billing-service-group")
    public void consumePaymentCompleted(byte[] message) {
        try {
            PaymentEvent event = PaymentEvent.parseFrom(message);
            log.info("Billing received payment.completed event: paymentId={}, appointmentId={}, patientId={}, amount={}",
                    event.getPaymentId(), event.getAppointmentId(), event.getPatientId(), event.getAmount());

            Invoice invoice = new Invoice(
                    event.getPaymentId(),
                    event.getAppointmentId(),
                    event.getPatientId(),
                    event.getAmount(),
                    "PAID"
            );

            invoiceStore.save(invoice);
            log.info("Generated and stored invoice: {} for patient: {}", invoice.getInvoiceId(), invoice.getPatientId());
        } catch (Exception e) {
            log.error("Failed to parse PaymentEvent or save invoice in billing-service", e);
        }
    }
}
