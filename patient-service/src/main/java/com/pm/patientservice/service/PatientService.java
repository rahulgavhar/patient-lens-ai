package com.pm.patientservice.service;

import com.pm.patientservice.dto.PatientRequestDTO;
import com.pm.patientservice.dto.PatientResponseDTO;
import com.pm.patientservice.exception.EmailAlreadyExistsException;
import com.pm.patientservice.exception.PatientNotFoundException;
import com.pm.patientservice.grpc.BillingServiceGrpcClient;
import com.pm.patientservice.kafka.KafkaProducer;
import com.pm.patientservice.mapper.PatientMapper;
import com.pm.patientservice.model.Patient;
import com.pm.patientservice.repository.PatientRepository;
import org.springframework.stereotype.Service;
import billing.BillingResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final BillingServiceGrpcClient billingServiceGrpcClient;
    private final KafkaProducer kafkaProducer;

    public PatientService(
            PatientRepository patientRepository,
            BillingServiceGrpcClient billingServiceGrpcClient,
            KafkaProducer kafkaProducer
    ) {
        this.patientRepository = patientRepository;
        this.billingServiceGrpcClient = billingServiceGrpcClient;
        this.kafkaProducer = kafkaProducer;
    }

    public List<PatientResponseDTO> getPatients() {
        return patientRepository.findAll()
                .stream()
                .map(PatientMapper::toDTO)
                .collect(Collectors.toList());
    }

    public PatientResponseDTO getPatientById(UUID id) {

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException(id.toString()));

        return PatientMapper.toDTO(patient);
    }

    public PatientResponseDTO createPatient(PatientRequestDTO dto) {

        if (patientRepository.existsByEmail(dto.getEmail())) {
            throw new EmailAlreadyExistsException(dto.getEmail());
        }

        Patient patient = PatientMapper.toModel(dto);

        // save patient
        Patient savedPatient = patientRepository.save(patient);

        // Create billing account (gRPC)
        BillingResponse billingResponse = billingServiceGrpcClient.createBillingAccount(
                savedPatient.getId().toString(),
                savedPatient.getName(),
                savedPatient.getEmail()
        );

        if (billingResponse != null && billingResponse.getAccountId() != null && !billingResponse.getAccountId().isEmpty()) {
            savedPatient.setBillingAccountId(billingResponse.getAccountId());
            savedPatient = patientRepository.save(savedPatient);
        }

        // Kafka Event
        kafkaProducer.sendPatientCreated(savedPatient);

        return PatientMapper.toDTO(savedPatient);
    }

    public PatientResponseDTO updatePatient(UUID id, PatientRequestDTO dto) {

        Patient existingPatient = patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException(id.toString()));

        if (!existingPatient.getEmail().equals(dto.getEmail())
                && patientRepository.existsByEmail(dto.getEmail())) {
            throw new EmailAlreadyExistsException(dto.getEmail());
        }

        existingPatient.setName(dto.getName());
        existingPatient.setEmail(dto.getEmail());
        existingPatient.setAddress(dto.getAddress());

        if (dto.getDateOfBirth() != null) {
            existingPatient.setDateOfBirth(dto.getDateOfBirth());
        }

        existingPatient.setHeight(dto.getHeight());
        existingPatient.setWeight(dto.getWeight());
        existingPatient.setBloodGroup(dto.getBloodGroup());
        existingPatient.setPhoneNumber(dto.getPhoneNumber());
        existingPatient.setEmergencyContact(dto.getEmergencyContact());
        existingPatient.setInsuranceProvider(dto.getInsuranceProvider());

        Patient updatedPatient = patientRepository.save(existingPatient);

        kafkaProducer.sendPatientUpdated(updatedPatient);

        return PatientMapper.toDTO(updatedPatient);
    }

    public void deletePatient(UUID id) {

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException(id.toString()));

        patientRepository.deleteById(id);

        kafkaProducer.sendPatientDeleted(patient);

        billingServiceGrpcClient.deleteBillingAccount(patient.getId().toString());
    }

    public PatientResponseDTO updatePatientHealth(UUID id, PatientRequestDTO dto) {

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException(id.toString()));

        patient.setHeight(dto.getHeight());
        patient.setWeight(dto.getWeight());
        patient.setBloodGroup(dto.getBloodGroup());

        Patient updatedPatient = patientRepository.save(patient);

        kafkaProducer.sendPatientHealthUpdated(updatedPatient);

        return PatientMapper.toDTO(updatedPatient);
    }
}