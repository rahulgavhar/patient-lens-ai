package com.pm.medicalrecordservice.controller;

import com.pm.medicalrecordservice.dto.MedicalRecordDto;
import com.pm.medicalrecordservice.service.MedicalRecordService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/medical-records")
public class MedicalRecordController {

    private final MedicalRecordService service;

    @Autowired
    public MedicalRecordController(MedicalRecordService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<MedicalRecordDto> createRecord(@Valid @RequestBody MedicalRecordDto dto) {
        MedicalRecordDto created = service.createRecord(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MedicalRecordDto> updateRecord(@PathVariable UUID id, @Valid @RequestBody MedicalRecordDto dto) {
        MedicalRecordDto updated = service.updateRecord(id, dto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicalRecordDto> getRecordById(@PathVariable UUID id) {
        MedicalRecordDto record = service.getRecordById(id);
        return ResponseEntity.ok(record);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalRecordDto>> getRecordsByPatientId(@PathVariable UUID patientId) {
        List<MedicalRecordDto> records = service.getRecordsByPatientId(patientId);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<MedicalRecordDto>> getRecordsByDoctorId(@PathVariable UUID doctorId) {
        List<MedicalRecordDto> records = service.getRecordsByDoctorId(doctorId);
        return ResponseEntity.ok(records);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable UUID id) {
        service.deleteRecord(id);
        return ResponseEntity.noContent().build();
    }
}
