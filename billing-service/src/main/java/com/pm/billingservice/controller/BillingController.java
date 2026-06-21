package com.pm.billingservice.controller;

import com.pm.billingservice.model.Invoice;
import com.pm.billingservice.store.InvoiceStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/invoices")
public class BillingController {

    private static final Logger log = LoggerFactory.getLogger(BillingController.class);

    private final InvoiceStore invoiceStore;

    public BillingController(InvoiceStore invoiceStore) {
        this.invoiceStore = invoiceStore;
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Invoice>> getInvoicesByPatient(@PathVariable String patientId) {
        log.info("REST request to get invoices for patientId={}", patientId);
        List<Invoice> invoices = invoiceStore.findByPatientId(patientId);
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<List<Invoice>> getInvoicesByAppointment(@PathVariable String appointmentId) {
        log.info("REST request to get invoices for appointmentId={}", appointmentId);
        List<Invoice> invoices = invoiceStore.findByAppointmentId(appointmentId);
        return ResponseEntity.ok(invoices);
    }
}
