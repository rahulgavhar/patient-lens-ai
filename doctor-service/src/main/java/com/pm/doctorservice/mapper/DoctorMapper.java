package com.pm.doctorservice.mapper;

import com.pm.doctorservice.dto.DoctorRequestDTO;
import com.pm.doctorservice.dto.DoctorResponseDTO;
import com.pm.doctorservice.model.Doctor;

public class DoctorMapper {

    // Convert Entity -> DTO
    public static DoctorResponseDTO toDTO(Doctor doctor) {
        DoctorResponseDTO dto = new DoctorResponseDTO();
        dto.setId(doctor.getId().toString());
        dto.setName(doctor.getName());
        dto.setEmail(doctor.getEmail());
        dto.setSpecialization(doctor.getSpecialization());
        dto.setLicenseNumber(doctor.getLicenseNumber());
        dto.setPhoneNumber(doctor.getPhoneNumber());
        dto.setYearsOfExperience(doctor.getYearsOfExperience());
        dto.setHospitalName(doctor.getHospitalName());
        dto.setJoinedDate(doctor.getJoinedDate());
        return dto;
    }

    // Convert DTO -> Entity
    public static Doctor toModel(DoctorRequestDTO dto) {
        Doctor doctor = new Doctor();
        doctor.setName(dto.getName());
        doctor.setEmail(dto.getEmail());
        doctor.setSpecialization(dto.getSpecialization());
        doctor.setLicenseNumber(dto.getLicenseNumber());
        doctor.setPhoneNumber(dto.getPhoneNumber());
        doctor.setYearsOfExperience(dto.getYearsOfExperience());
        doctor.setHospitalName(dto.getHospitalName());
        doctor.setJoinedDate(dto.getJoinedDate());
        return doctor;
    }
}