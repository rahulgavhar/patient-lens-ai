package com.pm.doctorservice.exception;

public class LicenseAlreadyExistsException extends RuntimeException {
    public LicenseAlreadyExistsException(String message) {
        super(message);
    }
}
