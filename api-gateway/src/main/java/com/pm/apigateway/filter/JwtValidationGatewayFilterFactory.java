package com.pm.apigateway.filter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Component
public class JwtValidationGatewayFilterFactory extends AbstractGatewayFilterFactory<Object> {

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JwtValidationGatewayFilterFactory(WebClient.Builder webClientBuilder, @Value("${auth.service.url}") String authServiceUrl) {
        this.webClient = webClientBuilder.baseUrl(authServiceUrl).build();
    }

    @Override
    public GatewayFilter apply(Object config) {
        return (exchange, chain) -> {
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            return webClient.get()
                    .uri("/validate")
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(3))
                    .flatMap(responseBody -> {
                        try {
                            // Parse the JSON response from auth-service /validate
                            JsonNode json = objectMapper.readTree(responseBody);
                            String email = json.has("email") ? json.get("email").asText() : "";
                            String role = json.has("role") ? json.get("role").asText() : "";
                            String username = json.has("username") ? json.get("username").asText() : "";

                            // Mutate the downstream request to include identity headers
                            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                                    .header("X-User-Email", email)
                                    .header("X-User-Role", role)
                                    .header("X-User-Username", username)
                                    .build();

                            return chain.filter(exchange.mutate().request(mutatedRequest).build());
                        } catch (Exception e) {
                            System.err.println("Failed to parse /validate response: " + e.getMessage());
                            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                            return exchange.getResponse().setComplete();
                        }
                    })
                    .onErrorResume(ex -> {
                        System.err.println("JWT validation failed error: " + ex.getMessage());
                        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                        return exchange.getResponse().setComplete();
                    });
        };
    }
}
