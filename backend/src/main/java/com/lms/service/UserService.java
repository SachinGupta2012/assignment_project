package com.lms.service;

import com.lms.dto.UserResponse;
import com.lms.entity.User;
import com.lms.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Comparator;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // GET /api/users/me
    @Transactional(readOnly = true)
    public UserResponse getMe() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName(); 

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return toResponse(user);
    }

    // GET /api/admin/users
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getLearners() {
        return userRepository.findAll().stream()
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .filter(user -> user.getRoles().stream()
                        .anyMatch(role -> "LEARNER".equals(role.getName())))
                .sorted(Comparator.comparing(User::getFirstName)
                        .thenComparing(User::getLastName))
                .map(this::toResponse)
                .toList();
    }

    // PATCH /api/admin/users/{userId}/active?active=
    @Transactional
    public UserResponse setActive(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setIsActive(active);
        return toResponse(userRepository.save(user));
    }

    private String resolveRole(User user) {
        return user.getRoles().isEmpty()
                ? "LEARNER"
                : user.getRoles().iterator().next().getName();
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                resolveRole(user),
                user.getIsActive()
        );
    }
}
