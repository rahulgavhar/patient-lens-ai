package com.pm.authservice.dto;

public class LoginResponseDTO {
    private final String token;
    private final String role;
    private final String email;
    private final String username;

    public LoginResponseDTO(String token, String role, String email, String username) {
        this.token = token;
        this.role = role;
        this.email = email;
        this.username = username;
    }

    public String getToken() {
        return token;
    }

    public String getRole() {
        return role;
    }

    public String getEmail() {
        return email;
    }

    public String getUsername() {
        return username;
    }
}
