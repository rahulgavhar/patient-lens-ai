package com.pm.analyticsservice.repository;

import com.pm.analyticsservice.model.PatientAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PatientAnalyticsRepository extends JpaRepository<PatientAnalytics, UUID> {
}
