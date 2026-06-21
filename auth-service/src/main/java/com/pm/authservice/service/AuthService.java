package com.pm.authservice.service;

import com.pm.authservice.dto.LoginRequestDTO;
import com.pm.authservice.dto.RegisterRequestDTO;
import com.pm.authservice.model.User;
import com.pm.authservice.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserService userService;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Authenticate by email or username. Returns a map with token, role, email, username.
     */
    public Optional<Map<String, String>> authenticate(LoginRequestDTO loginRequestDTO) {
        Optional<User> userOpt = Optional.empty();

        // Try email first, then username
        if (loginRequestDTO.getEmail() != null && !loginRequestDTO.getEmail().isBlank()) {
            userOpt = userService.findByEmail(loginRequestDTO.getEmail());
        }
        if (userOpt.isEmpty() && loginRequestDTO.getUsername() != null && !loginRequestDTO.getUsername().isBlank()) {
            userOpt = userService.findByUsername(loginRequestDTO.getUsername());
        }

        return userOpt
                .filter(u -> passwordEncoder.matches(loginRequestDTO.getPassword(), u.getPassword()))
                .map(u -> {
                    String token = jwtUtil.generateToken(u.getEmail(), u.getRole(), u.getUsername());
                    return Map.of(
                            "token", token,
                            "role", u.getRole(),
                            "email", u.getEmail(),
                            "username", u.getUsername()
                    );
                });
    }

    public boolean validateToken(String token) {
        try {
            jwtUtil.validateToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Map<String, String> extractTokenClaims(String token) {
        return jwtUtil.extractClaims(token);
    }

    /**
     * Register a new user. Returns the created user or throws if duplicate.
     */
    public User register(RegisterRequestDTO registerDTO) {
        if (userService.existsByEmail(registerDTO.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        if (userService.existsByUsername(registerDTO.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }

        User user = new User();
        user.setUsername(registerDTO.getUsername());
        user.setEmail(registerDTO.getEmail());
        user.setPassword(passwordEncoder.encode(registerDTO.getPassword()));
        user.setRole(registerDTO.getRole());

        return userService.createUser(user);
    }
}
