package com.pm.patientservice.dto;

import com.pm.patientservice.dto.validators.CreatePatientValidationGroup;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

public class PatientRequestDTO {

    @NotBlank(message="Name cannot be blank")
    @Size(max=100, message="Name cannot exceed 100 characters")
    private String name;

    @NotBlank(message="Email cannot be blank")
    @Email(message="Invalid email format")
    private String email;

    @NotBlank(message="Address cannot be blank")
    @Size(max=200, message="Address cannot exceed 200 characters")
    private String address;

    @NotNull(message="Date of Birth is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;

    // -----------------------------
    // Health Information
    // -----------------------------

    @Positive(message="Height must be positive")
    private Double height;

    @Positive(message="Weight must be positive")
    private Double weight;

    @Pattern(
            regexp = "^(A|B|AB|O)[+-]$",
            message = "Blood group must be valid (A+, A-, B+, B-, AB+, AB-, O+, O-)"
    )
    private String bloodGroup;

    // -----------------------------
    // Optional Patient Details
    // -----------------------------

    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    @Pattern(
            regexp="^[0-9+\\-() ]{7,20}$",
            message="Invalid phone number"
    )
    private String phoneNumber;

    @Size(max = 100, message = "Emergency contact cannot exceed 100 characters")
    private String emergencyContact;

    @Size(max = 100, message = "Insurance provider cannot exceed 100 characters")
    private String insuranceProvider;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public Double getHeight() {
        return height;
    }

    public void setHeight(Double height) {
        this.height = height;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public String getInsuranceProvider() {
        return insuranceProvider;
    }

    public void setInsuranceProvider(String insuranceProvider) {
        this.insuranceProvider = insuranceProvider;
    }
}