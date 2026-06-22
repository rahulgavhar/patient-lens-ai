package com.pm.medicalrecordservice.mapper;

import com.pm.medicalrecordservice.dto.MedicalRecordDto;
import com.pm.medicalrecordservice.entity.MedicalRecord;

public class MedicalRecordMapper {

    public static MedicalRecordDto toDto(MedicalRecord record) {
        if (record == null) return null;
        MedicalRecordDto dto = new MedicalRecordDto();
        dto.setId(record.getId());
        dto.setPatientId(record.getPatientId());
        dto.setDoctorId(record.getDoctorId());
        dto.setDoctorName(record.getDoctorName());
        dto.setDiagnosis(record.getDiagnosis());
        dto.setPrescription(record.getPrescription());
        dto.setLabResults(record.getLabResults());
        dto.setVitals(record.getVitals());
        dto.setConsultationNotes(record.getConsultationNotes());
        dto.setCreatedAt(record.getCreatedAt());
        dto.setUpdatedAt(record.getUpdatedAt());
        return dto;
    }

    public static MedicalRecord toEntity(MedicalRecordDto dto) {
        if (dto == null) return null;
        MedicalRecord entity = new MedicalRecord();
        entity.setId(dto.getId());
        entity.setPatientId(dto.getPatientId());
        entity.setDoctorId(dto.getDoctorId());
        entity.setDoctorName(dto.getDoctorName());
        entity.setDiagnosis(dto.getDiagnosis());
        entity.setPrescription(dto.getPrescription());
        entity.setLabResults(dto.getLabResults());
        entity.setVitals(dto.getVitals());
        entity.setConsultationNotes(dto.getConsultationNotes());
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setUpdatedAt(dto.getUpdatedAt());
        return entity;
    }
}
