package com.pm.authservice.util;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtil {

    private final Key secretKey;

    public JwtUtil(@Value("${jwt.secret}") String secret) {

        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 characters");
        }

        this.secretKey = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );
    }

    public String generateToken(String email, String role, String username) {
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .claim("username", username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600 * 10000))
                .signWith(secretKey)
                .compact();
    }

    public void validateToken(String token) {
        try{
            Jwts.parser().verifyWith((SecretKey) secretKey).build().parseSignedClaims(token);
        } catch (JwtException e) {
            throw new JwtException("Invalid JWT token");
        }
    }

    /**
     * Extract claims from a validated JWT token.
     * Returns a map with email (subject), role, and username.
     */
    public Map<String, String> extractClaims(String token) {
        Claims claims = Jwts.parser()
                .verifyWith((SecretKey) secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return Map.of(
                "email", claims.getSubject(),
                "role", claims.get("role", String.class),
                "username", claims.get("username", String.class) != null
                        ? claims.get("username", String.class) : ""
        );
    }
}