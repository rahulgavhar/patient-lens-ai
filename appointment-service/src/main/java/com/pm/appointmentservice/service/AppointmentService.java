package com.pm.appointmentservice.service;

import com.pm.appointmentservice.entity.Appointment;

import java.util.List;
import java.util.UUID;

public interface AppointmentService {
    Appointment createAppointment(Appointment appointment);
    Appointment getAppointment(UUID id);
    List<Appointment> getAppointmentsByPatient(String patientId);
}
