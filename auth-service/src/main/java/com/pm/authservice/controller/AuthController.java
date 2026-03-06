package com.pm.authservice.controller;

import com.pm.authservice.dto.LoginResponseDTO;
import com.pm.authservice.dto.LoginRequestDTO;
import com.pm.authservice.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
public class AuthController {
    @Autowired
    private AuthService authService;

    @Operation(summary = "Generate JWT token for user authentication")
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO loginrequestDTO) {
        Optional<String> tokenOptional =
                authService.authenticate(loginrequestDTO);
        if(tokenOptional.isPresent()) {
            LoginResponseDTO responseDTO = new LoginResponseDTO(tokenOptional.get());
            return ResponseEntity.ok(responseDTO);
        } else {
            return ResponseEntity.status(401).build();
        }
    }

    @Operation(summary = "Validate JWT token and return user email and role")
    @GetMapping("/validate")
    public ResponseEntity<LoginResponseDTO> validateToken(@RequestHeader("Authorization") String authHeader) {
        if(authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = authHeader.substring(7);
        return authService.validateToken(token)
                ? ResponseEntity.ok().build()
                : ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}
