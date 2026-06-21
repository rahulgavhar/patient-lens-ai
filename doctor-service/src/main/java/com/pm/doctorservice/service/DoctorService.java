package com.pm.doctorservice.service;

import com.pm.doctorservice.dto.DoctorRequestDTO;
import com.pm.doctorservice.dto.DoctorResponseDTO;

import java.util.List;
import java.util.UUID;

public interface DoctorService {
    List<DoctorResponseDTO> getAllDoctors();
    DoctorResponseDTO getDoctorById(UUID id);
    DoctorResponseDTO createDoctor(DoctorRequestDTO doctorRequestDTO);
    DoctorResponseDTO updateDoctor(UUID id, DoctorRequestDTO doctorRequestDTO);
    void deleteDoctor(UUID id);
}
