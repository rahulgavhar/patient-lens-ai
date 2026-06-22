package com.pm.medicalrecordservice.service;

import com.pm.medicalrecordservice.dto.MedicalRecordDto;
import com.pm.medicalrecordservice.entity.MedicalRecord;
import com.pm.medicalrecordservice.exception.ResourceNotFoundException;
import com.pm.medicalrecordservice.mapper.MedicalRecordMapper;
import com.pm.medicalrecordservice.repository.MedicalRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class MedicalRecordService {

    private final MedicalRecordRepository repository;

    @Autowired
    public MedicalRecordService(MedicalRecordRepository repository) {
        this.repository = repository;
    }

    public MedicalRecordDto createRecord(MedicalRecordDto dto) {
        MedicalRecord entity = MedicalRecordMapper.toEntity(dto);
        entity.setId(null); // Ensure ID is null for creation
        MedicalRecord saved = repository.save(entity);
        return MedicalRecordMapper.toDto(saved);
    }

    public MedicalRecordDto updateRecord(UUID id, MedicalRecordDto dto) {
        MedicalRecord existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with id: " + id));

        existing.setDiagnosis(dto.getDiagnosis());
        existing.setPrescription(dto.getPrescription());
        existing.setLabResults(dto.getLabResults());
        existing.setVitals(dto.getVitals());
        existing.setConsultationNotes(dto.getConsultationNotes());
        
        if (dto.getDoctorName() != null) {
            existing.setDoctorName(dto.getDoctorName());
        }

        MedicalRecord saved = repository.save(existing);
        return MedicalRecordMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public MedicalRecordDto getRecordById(UUID id) {
        MedicalRecord record = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with id: " + id));
        return MedicalRecordMapper.toDto(record);
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordDto> getRecordsByPatientId(UUID patientId) {
        return repository.findByPatientId(patientId).stream()
                .map(MedicalRecordMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordDto> getRecordsByDoctorId(UUID doctorId) {
        return repository.findByDoctorId(doctorId).stream()
                .map(MedicalRecordMapper::toDto)
                .collect(Collectors.toList());
    }

    public void deleteRecord(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Medical record not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
