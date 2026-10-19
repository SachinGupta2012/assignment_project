package com.lms.security;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http){
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/courses").hasAnyRole("ADMIN", "INSTRUCTOR")
                .requestMatchers(HttpMethod.POST, "/api/courses/{courseId}/modules").hasAnyRole("ADMIN", "INSTRUCTOR")
                .requestMatchers(HttpMethod.PUT, "/api/courses/{courseId}/modules/{moduleId}").hasAnyRole("ADMIN", "INSTRUCTOR")
                .requestMatchers(HttpMethod.POST, "/api/courses/{courseId}/modules/{moduleId}/lessons").hasAnyRole("ADMIN", "INSTRUCTOR")
                .requestMatchers(HttpMethod.PUT, "/api/courses/{courseId}/modules/{moduleId}/lessons/{lessonId}").hasAnyRole("ADMIN", "INSTRUCTOR")
                .requestMatchers(HttpMethod.POST, "/api/courses/{courseId}/enrollments").hasAnyRole("ADMIN", "TRAINING_MANAGER")
                .requestMatchers(HttpMethod.PATCH, "/api/enrollments/{enrollmentId}").hasAnyRole("ADMIN", "TRAINING_MANAGER")
                .requestMatchers(HttpMethod.GET, "/api/users/learners").hasAnyRole("ADMIN", "TRAINING_MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/courses/{courseId}/assessments").hasAnyRole("ADMIN", "INSTRUCTOR")
                .requestMatchers(HttpMethod.POST, "/api/assessments/{assessmentId}/questions").hasAnyRole("ADMIN", "INSTRUCTOR")
                .requestMatchers(HttpMethod.GET, "/api/assessments/{assessmentId}/questions/with-answers").hasAnyRole("ADMIN", "INSTRUCTOR")
                .requestMatchers(HttpMethod.POST, "/api/assessments/{assessmentId}/attempts").hasAnyRole("LEARNER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/attempts/{attemptId}/submit").hasAnyRole("LEARNER", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/attempts/{attemptId}/answers").hasAnyRole("LEARNER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/assessments/{assessmentId}/attempts/me").hasAnyRole("LEARNER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/attempts/{attemptId}/answers").hasAnyRole("LEARNER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/grading/queue").hasAnyRole("ADMIN", "INSTRUCTOR")
                .requestMatchers(HttpMethod.PATCH, "/api/grading/answers/{answerId}").hasAnyRole("ADMIN", "INSTRUCTOR")
                .requestMatchers(HttpMethod.POST, "/api/lessons/{lessonId}/complete").hasAnyRole("LEARNER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/courses/{courseId}/resume").hasAnyRole("LEARNER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/reports/**").hasAnyRole("ADMIN", "TRAINING_MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/courses/{courseId}").hasAnyRole("ADMIN", "INSTRUCTOR")
                .requestMatchers(HttpMethod.PATCH, "/api/courses/{courseId}/status").hasAnyRole("ADMIN", "INSTRUCTOR")
                .requestMatchers(HttpMethod.POST, "/api/courses/{courseId}/self-enroll").hasAnyRole("LEARNER", "ADMIN")
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers("/docs/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .sessionManagement(
                session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(new CorrelationIdFilter(), UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(){
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization","Content-Type"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
