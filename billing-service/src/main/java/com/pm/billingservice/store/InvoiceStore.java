package com.pm.billingservice.store;

import com.pm.billingservice.model.Invoice;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
public class InvoiceStore {
    private final Map<String, Invoice> invoiceMap = new ConcurrentHashMap<>();

    public void save(Invoice invoice) {
        invoiceMap.put(invoice.getInvoiceId(), invoice);
    }

    public List<Invoice> findByPatientId(String patientId) {
        return invoiceMap.values().stream()
                .filter(inv -> patientId.equals(inv.getPatientId()))
                .collect(Collectors.toList());
    }

    public List<Invoice> findByAppointmentId(String appointmentId) {
        return invoiceMap.values().stream()
                .filter(inv -> appointmentId.equals(inv.getAppointmentId()))
                .collect(Collectors.toList());
    }
}
