package com.pm.authservice.controller;

import com.pm.authservice.dto.LoginResponseDTO;
import com.pm.authservice.dto.LoginRequestDTO;
import com.pm.authservice.dto.RegisterRequestDTO;
import com.pm.authservice.model.User;
import com.pm.authservice.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
public class AuthController {
    @Autowired
    private AuthService authService;

    @Operation(summary = "Generate JWT token for user authentication via email or username")
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequestDTO) {
        // Validate that at least email or username is provided
        if ((loginRequestDTO.getEmail() == null || loginRequestDTO.getEmail().isBlank())
                && (loginRequestDTO.getUsername() == null || loginRequestDTO.getUsername().isBlank())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Either email or username is required"));
        }

        Optional<Map<String, String>> result = authService.authenticate(loginRequestDTO);
        if (result.isPresent()) {
            Map<String, String> authData = result.get();
            LoginResponseDTO responseDTO = new LoginResponseDTO(
                    authData.get("token"),
                    authData.get("role"),
                    authData.get("email"),
                    authData.get("username")
            );
            return ResponseEntity.ok(responseDTO);
        } else {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Invalid credentials"));
        }
    }

    @Operation(summary = "Validate JWT token and return user identity (email, role, username)")
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing or invalid Authorization header"));
        }
        String token = authHeader.substring(7);

        if (!authService.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired token"));
        }

        // Extract and return the user's claims so the Gateway can forward them
        Map<String, String> claims = authService.extractTokenClaims(token);
        return ResponseEntity.ok(claims);
    }

    @Operation(summary = "Register a new user account")
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDTO registerDTO) {
        try {
            User created = authService.register(registerDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "User registered successfully",
                    "username", created.getUsername(),
                    "email", created.getEmail(),
                    "role", created.getRole()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
