package com.pm.analyticsservice.controller;

import com.pm.analyticsservice.model.PatientAnalytics;
import com.pm.analyticsservice.repository.PatientAnalyticsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsController.class);

    private final PatientAnalyticsRepository analyticsRepository;

    public AnalyticsController(PatientAnalyticsRepository analyticsRepository) {
        this.analyticsRepository = analyticsRepository;
    }

    @GetMapping("/patients")
    public ResponseEntity<List<PatientAnalytics>> getAnalyticsPatients() {
        log.info("Request to get all patient analytics records");
        return ResponseEntity.ok(analyticsRepository.findAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAnalyticsStats() {
        log.info("Request to get aggregated patient statistics");
        List<PatientAnalytics> patients = analyticsRepository.findAll();

        int patientCount = patients.size();
        int totalEvents = 0;
        double sumHeight = 0;
        int heightCount = 0;
        double sumWeight = 0;
        int weightCount = 0;

        Map<String, Integer> bloodGroupDistribution = new HashMap<>();

        for (PatientAnalytics p : patients) {
            totalEvents += p.getEventCount();
            
            if (p.getHeight() != null && p.getHeight() > 0) {
                sumHeight += p.getHeight();
                heightCount++;
            }
            
            if (p.getWeight() != null && p.getWeight() > 0) {
                sumWeight += p.getWeight();
                weightCount++;
            }

            if (p.getBloodGroup() != null && !p.getBloodGroup().isEmpty()) {
                bloodGroupDistribution.put(p.getBloodGroup(), 
                        bloodGroupDistribution.getOrDefault(p.getBloodGroup(), 0) + 1);
            }
        }

        double averageHeight = heightCount > 0 ? (sumHeight / heightCount) : 0.0;
        double averageWeight = weightCount > 0 ? (sumWeight / weightCount) : 0.0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("patientCount", patientCount);
        stats.put("totalEvents", totalEvents);
        stats.put("averageHeight", Math.round(averageHeight * 10.0) / 10.0);
        stats.put("averageWeight", Math.round(averageWeight * 10.0) / 10.0);
        stats.put("bloodGroupDistribution", bloodGroupDistribution);

        return ResponseEntity.ok(stats);
    }
}
