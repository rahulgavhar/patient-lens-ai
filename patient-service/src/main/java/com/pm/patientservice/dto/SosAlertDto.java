package com.pm.patientservice.dto;

import com.pm.patientservice.model.SosAlertStatus;
import java.time.LocalDateTime;

public class SosAlertDto {
    private Long id;
    private String patientId;
    private String patientName;
    private LocalDateTime timestamp;
    private SosAlertStatus status;

    public SosAlertDto() {
    }

    public SosAlertDto(Long id, String patientId, String patientName, LocalDateTime timestamp, SosAlertStatus status) {
        this.id = id;
        this.patientId = patientId;
        this.patientName = patientName;
        this.timestamp = timestamp;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public SosAlertStatus getStatus() {
        return status;
    }

    public void setStatus(SosAlertStatus status) {
        this.status = status;
    }
}
