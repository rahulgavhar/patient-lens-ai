package com.pm.medicalrecordservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "medical_records",
        indexes = {
                @Index(name = "idx_medical_record_patient", columnList = "patient_id")
        }
)
public class MedicalRecord {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @NotNull
    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @NotNull
    @Column(name = "doctor_id", nullable = false)
    private UUID doctorId;

    @NotNull
    @Column(name = "doctor_name", nullable = false)
    private String doctorName;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String prescription;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String labResults;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String vitals;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String consultationNotes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getPatientId() {
        return patientId;
    }

    public void setPatientId(UUID patientId) {
        this.patientId = patientId;
    }

    public UUID getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(UUID doctorId) {
        this.doctorId = doctorId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getPrescription() {
        return prescription;
    }

    public void setPrescription(String prescription) {
        this.prescription = prescription;
    }

    public String getLabResults() {
        return labResults;
    }

    public void setLabResults(String labResults) {
        this.labResults = labResults;
    }

    public String getVitals() {
        return vitals;
    }

    public void setVitals(String vitals) {
        this.vitals = vitals;
    }

    public String getConsultationNotes() {
        return consultationNotes;
    }

    public void setConsultationNotes(String consultationNotes) {
        this.consultationNotes = consultationNotes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
