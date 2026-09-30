package com.lms.security;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil{
    @Value("${jwt.secret}")
    private String secret;
    @Value("${jwt.expiration}")
    private long expiration;

    public String generateToken(String email, String role) {

        return Jwts.builder()
            .subject(email)
            .claim("role", role)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getSecretKey())
            .compact();

    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(getSecretKey()).build()
                .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    
    }

    public String extractEmail(String token) {
        return Jwts.parser().verifyWith(getSecretKey()).build()
            .parseSignedClaims(token).getPayload().getSubject();
    }

    public String extractRole(String token) {
        return Jwts.parser().verifyWith(getSecretKey()).build()
            .parseSignedClaims(token).getPayload().get("role", String.class);
    }

    private SecretKey getSecretKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }


}