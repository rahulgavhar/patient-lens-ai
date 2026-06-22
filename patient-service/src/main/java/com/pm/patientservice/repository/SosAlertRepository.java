package com.pm.patientservice.repository;

import com.pm.patientservice.model.SosAlert;
import com.pm.patientservice.model.SosAlertStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SosAlertRepository extends JpaRepository<SosAlert, Long> {
    List<SosAlert> findByStatusOrderByTimestampDesc(SosAlertStatus status);
}
