package com.lms.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.lms.dto.LoginRequest;
import com.lms.dto.LoginResponse;
import com.lms.dto.RegisterRequest;
import com.lms.entity.Role;
import com.lms.entity.User;
import com.lms.repository.RoleRepository;
import com.lms.repository.UserRepository;
import com.lms.security.JwtUtil;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    
    public AuthService(UserRepository userRepository, 
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder, 
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    
    public String register(RegisterRequest request) {
        // this checks if an email exists or not 
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword())); // hash password
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setIsActive(true); // new accounts start active; admin can deactivate later

        // Public registration always creates a learner account
        Role role = roleRepository.findByName("LEARNER")
                .orElseThrow(() -> new RuntimeException("Learner role not found"));
        user.getRoles().add(role);

        userRepository.save(user);

        return "Registration successful";
    }

    
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        
        // this reads the role and if not then learner assigns
        String role = user.getRoles().isEmpty()
                ? "LEARNER"
                : user.getRoles().iterator().next().getName();

        String token = jwtUtil.generateToken(user.getEmail(), role);

        return new LoginResponse(token, user.getEmail());
    }
}
