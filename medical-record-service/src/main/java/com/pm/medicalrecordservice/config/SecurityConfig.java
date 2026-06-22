package com.pm.medicalrecordservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(new RoleAuthorizationFilter(), UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                // Read access: ADMIN, DOCTOR, PATIENT
                .requestMatchers(HttpMethod.GET, "/medical-records/**").hasAnyRole("ADMIN", "DOCTOR", "PATIENT")
                // Write access: DOCTOR and ADMIN
                .requestMatchers(HttpMethod.POST, "/medical-records/**").hasAnyRole("DOCTOR", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/medical-records/**").hasAnyRole("DOCTOR", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/medical-records/**").hasAnyRole("DOCTOR", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/medical-records/**").hasAnyRole("ADMIN", "DOCTOR")
                // Swagger / Actuator endpoints
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }
}
