package com.consultingplatform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.Customizer;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // This enables @PreAuthorize annotations to work!
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF for API usage
            .authorizeHttpRequests(auth -> auth
                // Allow Swagger UI and API Docs
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            // Use HTTP Basic authentication to easily test via Swagger
            .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    // Creating some hardcoded users for testing APIs via Swagger
    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        UserDetails admin = User.builder()
            .username("admin")
            .password(passwordEncoder.encode("admin"))
            .roles("ADMIN") 
            .build();

        UserDetails consultant = User.builder()
            .username("consultant")
            .password(passwordEncoder.encode("consultant"))
            .roles("CONSULTANT")
            .build();

        UserDetails client = User.builder()
            .username("client")
            .password(passwordEncoder.encode("client"))
            .roles("CLIENT")
            .build();

        return new InMemoryUserDetailsManager(admin, consultant, client);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}