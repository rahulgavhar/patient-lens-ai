package com.pm.patientservice.config;

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
                // Read access: all authenticated roles
                .requestMatchers(HttpMethod.GET, "/patients/**").hasAnyRole("ADMIN", "DOCTOR", "PATIENT")
                // Write access: ADMIN only
                .requestMatchers(HttpMethod.POST, "/patients/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/patients/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/patients/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/patients/**").hasRole("ADMIN")
                // Swagger / Actuator endpoints
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }
}
