package com.pm.notificationservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromEmail;
    private final String mailHost;

    public EmailService(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${spring.mail.username:}") String fromEmail,
            @Value("${spring.mail.host:}") String mailHost) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
        this.mailHost = mailHost;
    }

    public void sendEmail(String toEmail, String subject, String body) {
        if (mailSender == null || mailHost == null || mailHost.isBlank() || "none".equalsIgnoreCase(mailHost)) {
            log.info("=== [MOCK EMAIL SENDER] ===");
            log.info("To: {}", toEmail);
            log.info("Subject: {}", subject);
            log.info("Body: {}", body);
            log.info("============================");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail != null && !fromEmail.isBlank() ? fromEmail : "no-reply@patientlens.com");
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Real email successfully sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send real email to {}: {}", toEmail, e.getMessage());
            // Fallback to mock log
            log.info("=== [MOCK EMAIL SENDER - FALLBACK] ===");
            log.info("To: {}", toEmail);
            log.info("Subject: {}", subject);
            log.info("Body: {}", body);
            log.info("======================================");
        }
    }
}
