package com.pm.patientservice.mapper;

import com.pm.patientservice.dto.PatientRequestDTO;
import com.pm.patientservice.dto.PatientResponseDTO;
import com.pm.patientservice.model.Patient;

public final class PatientMapper {

    private PatientMapper() {
        // Utility class - prevent instantiation
    }

    public static PatientResponseDTO toDTO(Patient patient) {

        if (patient == null) {
            return null;
        }

        PatientResponseDTO dto = new PatientResponseDTO();

        // Basic info
        dto.setId(patient.getId());
        dto.setName(patient.getName());
        dto.setEmail(patient.getEmail());
        dto.setAddress(patient.getAddress());

        // Dates
        dto.setDateOfBirth(patient.getDateOfBirth());
        dto.setRegisteredDate(patient.getRegisteredDate());

        // Health info
        dto.setHeight(patient.getHeight());
        dto.setWeight(patient.getWeight());
        dto.setBloodGroup(patient.getBloodGroup());

        // Optional details
        dto.setPhoneNumber(patient.getPhoneNumber());
        dto.setEmergencyContact(patient.getEmergencyContact());
        dto.setInsuranceProvider(patient.getInsuranceProvider());

        // External references
        dto.setBillingAccountId(patient.getBillingAccountId());
        dto.setPaymentAccountId(patient.getPaymentAccountId());

        // Audit fields
        dto.setCreatedAt(patient.getCreatedAt());
        dto.setUpdatedAt(patient.getUpdatedAt());

        return dto;
    }

    public static Patient toModel(PatientRequestDTO dto) {

        if (dto == null) {
            return null;
        }

        Patient patient = new Patient();

        // Basic info
        patient.setName(dto.getName());
        patient.setEmail(dto.getEmail());
        patient.setAddress(dto.getAddress());

        // Date (no parsing needed if DTO uses LocalDate)
        if (dto.getDateOfBirth() != null) {
            patient.setDateOfBirth(dto.getDateOfBirth());
        }

        // Health info
        patient.setHeight(dto.getHeight());
        patient.setWeight(dto.getWeight());
        patient.setBloodGroup(dto.getBloodGroup());

        // Optional details
        patient.setPhoneNumber(dto.getPhoneNumber());
        patient.setEmergencyContact(dto.getEmergencyContact());
        patient.setInsuranceProvider(dto.getInsuranceProvider());

        return patient;
    }
}