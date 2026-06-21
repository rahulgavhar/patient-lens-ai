package com.pm.doctorservice.service;

import com.pm.doctorservice.dto.DoctorRequestDTO;
import com.pm.doctorservice.dto.DoctorResponseDTO;
import com.pm.doctorservice.exception.DoctorNotFoundException;
import com.pm.doctorservice.exception.EmailAlreadyExistsException;
import com.pm.doctorservice.exception.LicenseAlreadyExistsException;
import com.pm.doctorservice.mapper.DoctorMapper;
import com.pm.doctorservice.model.Doctor;
import com.pm.doctorservice.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorServiceImpl(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorResponseDTO> getAllDoctors() {
        return doctorRepository.findAll().stream()
                .map(DoctorMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorResponseDTO getDoctorById(UUID id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new DoctorNotFoundException(id.toString()));
        return DoctorMapper.toDTO(doctor);
    }

    @Override
    public DoctorResponseDTO createDoctor(DoctorRequestDTO doctorRequestDTO) {
        doctorRepository.findByEmail(doctorRequestDTO.getEmail())
                .ifPresent(d -> {
                    throw new EmailAlreadyExistsException(doctorRequestDTO.getEmail());
                });

        doctorRepository.findByLicenseNumber(doctorRequestDTO.getLicenseNumber())
                .ifPresent(d -> {
                    throw new LicenseAlreadyExistsException(doctorRequestDTO.getLicenseNumber());
                });

        Doctor doctor = DoctorMapper.toModel(doctorRequestDTO);
        Doctor saved = doctorRepository.save(doctor);
        return DoctorMapper.toDTO(saved);
    }

    @Override
    public DoctorResponseDTO updateDoctor(UUID id, DoctorRequestDTO doctorRequestDTO) {
        Doctor existing = doctorRepository.findById(id)
                .orElseThrow(() -> new DoctorNotFoundException(id.toString()));

        doctorRepository.findByEmail(doctorRequestDTO.getEmail())
                .ifPresent(d -> {
                    if (!d.getId().equals(id)) {
                        throw new EmailAlreadyExistsException(doctorRequestDTO.getEmail());
                    }
                });

        doctorRepository.findByLicenseNumber(doctorRequestDTO.getLicenseNumber())
                .ifPresent(d -> {
                    if (!d.getId().equals(id)) {
                        throw new LicenseAlreadyExistsException(doctorRequestDTO.getLicenseNumber());
                    }
                });

        existing.setName(doctorRequestDTO.getName());
        existing.setEmail(doctorRequestDTO.getEmail());
        existing.setSpecialization(doctorRequestDTO.getSpecialization());
        existing.setLicenseNumber(doctorRequestDTO.getLicenseNumber());
        existing.setPhoneNumber(doctorRequestDTO.getPhoneNumber());
        existing.setYearsOfExperience(doctorRequestDTO.getYearsOfExperience());
        existing.setHospitalName(doctorRequestDTO.getHospitalName());
        existing.setJoinedDate(doctorRequestDTO.getJoinedDate());

        Doctor saved = doctorRepository.save(existing);
        return DoctorMapper.toDTO(saved);
    }

    @Override
    public void deleteDoctor(UUID id) {
        if (!doctorRepository.existsById(id)) {
            throw new DoctorNotFoundException(id.toString());
        }
        doctorRepository.deleteById(id);
    }
}
