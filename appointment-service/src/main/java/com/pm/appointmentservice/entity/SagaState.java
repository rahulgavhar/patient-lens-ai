package com.pm.appointmentservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "saga_states")
@Getter
@Setter
public class SagaState {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "appointment_id", nullable = false)
    private String appointmentId;

    @Column(nullable = false)
    private String step; // PAYMENT, NOTIFICATION

    @Column(nullable = false)
    private String status; // SUCCESS, FAILED, COMPENSATED

    @Column(name = "compensation_data", columnDefinition = "TEXT")
    private String compensationData;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
