package com.pm.paymentservice.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Getter
@Setter
public class Payment {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "appointment_id", nullable = false)
    private String appointmentId;

    @Column(name = "patient_id", nullable = false)
    private String patientId;

    @Column(nullable = false)
    private double amount;

    @Column(nullable = false)
    private String status; // COMPLETED, FAILED, REFUNDED

    @Column(name = "gateway_transaction_id")
    private String gatewayTransactionId;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
