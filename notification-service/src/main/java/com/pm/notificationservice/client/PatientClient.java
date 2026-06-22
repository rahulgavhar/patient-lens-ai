package com.pm.notificationservice.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.util.Map;

@Component
public class PatientClient {

    private static final Logger log = LoggerFactory.getLogger(PatientClient.class);

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${patient.service.url:http://patient-service:4000}")
    private String patientServiceUrl;

    @SuppressWarnings("unchecked")
    public Map<String, Object> getPatient(String patientId) {
        try {
            String url = patientServiceUrl + "/patients/" + patientId;
            log.info("Fetching patient details via HTTP from: {}", url);

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-User-Role", "ADMIN");
            headers.set("X-User-Email", "notification-service@patientlens.com");

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<String, Object>) response.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to fetch patient {} details from patient-service: {}", patientId, e.getMessage());
        }
        return null;
    }
}
