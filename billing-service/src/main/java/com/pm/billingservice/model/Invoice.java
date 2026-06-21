package com.pm.billingservice.model;

import java.util.UUID;

public class Invoice {
    private String invoiceId;
    private String paymentId;
    private String appointmentId;
    private String patientId;
    private double amount;
    private String status;

    public Invoice() {}

    public Invoice(String paymentId, String appointmentId, String patientId, double amount, String status) {
        this.invoiceId = "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.paymentId = paymentId;
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.amount = amount;
        this.status = status;
    }

    public String getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(String invoiceId) {
        this.invoiceId = invoiceId;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }

    public String getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(String appointmentId) {
        this.appointmentId = appointmentId;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
