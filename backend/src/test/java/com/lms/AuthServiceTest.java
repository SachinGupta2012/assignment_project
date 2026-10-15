package com.lms;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dto.RegisterRequest;
import com.lms.service.AuthService;
import com.lms.service.UserService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
public class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    private void loginAs(String email, String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null,
                        List.of(new SimpleGrantedAuthority(role))));
    }

    @Test
    public void registerAndLogin() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test.auth@lms.com");
        request.setPassword("Test@123");
        request.setFirstName("Test");
        request.setLastName("Auth");

        assertEquals("Registration successful", authService.register(request));

        var response = authService.login(loginRequest("test.auth@lms.com", "Test@123"));
        assertEquals("test.auth@lms.com", response.getEmail());
    }

    @Test
    public void wrongPasswordFails() {
        assertThrows(RuntimeException.class,
                () -> authService.login(loginRequest("ananya.iyer@lms.com", "Wrong@123")));
    }

    @Test
    public void duplicateRegisterFails() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("ananya.iyer@lms.com");
        request.setPassword("Test@123");
        request.setFirstName("A");
        request.setLastName("B");

        assertThrows(RuntimeException.class, () -> authService.register(request));
    }

    @Test
    public void deactivatedAccountCannotLogin() {
        loginAs("arjun.nair@lms.com", "ROLE_ADMIN");
        Long learnerId = userService.getAllUsers().stream()
                .filter(u -> "ananya.iyer@lms.com".equals(u.getEmail()))
                .findFirst().orElseThrow().getId();

        userService.setActive(learnerId, false);

        assertThrows(RuntimeException.class,
                () -> authService.login(loginRequest("ananya.iyer@lms.com", "Learner@123")));
    }

    private com.lms.dto.LoginRequest loginRequest(String email, String password) {
        com.lms.dto.LoginRequest request = new com.lms.dto.LoginRequest();
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }
}
