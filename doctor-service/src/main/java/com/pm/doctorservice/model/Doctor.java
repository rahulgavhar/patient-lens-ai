package com.pm.doctorservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "doctors")
public class Doctor {

    @Setter
    @Getter
    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Setter
    @Getter
    @NotNull
    @Column(nullable = false)
    private String name;

    @NotNull
    @Email
    @Column(nullable = false, unique = true)
    private String email;

    @NotNull
    @Column(nullable = false)
    private String specialization;

    @NotNull
    @Column(nullable = false, unique = true)
    private String licenseNumber;

    @Setter
    @Getter
    private String phoneNumber;

    @Setter
    @Getter
    private Integer yearsOfExperience;

    @Setter
    @Getter
    private String hospitalName;

    @Setter
    @Getter
    private LocalDate joinedDate;

    // audit fields
    @Getter
    private LocalDateTime createdAt;

    @Getter
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        if (joinedDate == null) {
            joinedDate = LocalDate.now();
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public @NotNull @Email String getEmail() {
        return email;
    }

    public void setEmail(@NotNull @Email String email) {
        this.email = email;
    }

    public @NotNull String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(@NotNull String specialization) {
        this.specialization = specialization;
    }

    public @NotNull String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(@NotNull String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

}