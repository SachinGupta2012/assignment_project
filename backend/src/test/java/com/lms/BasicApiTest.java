package com.lms;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// The only MockMvc test: proves the HTTP layer works
// (login, security chain, role rules). Everything else is plain JUnit.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class BasicApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void loginReturnsToken() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"ananya.iyer@lms.com\",\"password\":\"Learner@123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    public void noTokenIsRejected() throws Exception {
        mockMvc.perform(get("/api/courses"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void rolesAreEnforced() throws Exception {
        String learnerToken = login("ananya.iyer@lms.com", "Learner@123");
        String instructorToken = login("vikram.singh@lms.com", "Instructor@123");
        Long instructorId = userIdByEmail("arjun.nair@lms.com", "Admin@123", "vikram.singh@lms.com");
        String body = "{\"title\":\"Role Course\",\"description\":\"d\",\"instructorId\":" + instructorId
                + ",\"estimateDuration\":10,\"level\":\"beginner\",\"enrollmentMode\":\"open\"}";

        mockMvc.perform(post("/api/courses")
                .header("Authorization", "Bearer " + learnerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/courses")
                .header("Authorization", "Bearer " + instructorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isCreated());
    }

    private String login(String email, String password) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return new ObjectMapper().readTree(body).get("token").asText();
    }

    private Long userIdByEmail(String adminEmail, String adminPassword, String email) throws Exception {
        String adminToken = login(adminEmail, adminPassword);
        String body = mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        for (JsonNode user : new ObjectMapper().readTree(body)) {
            if (email.equals(user.get("email").asText())) {
                return user.get("id").asLong();
            }
        }
        throw new RuntimeException("User not found in test: " + email);
    }
}
