package com.lms;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dto.AssessmentRequest;
import com.lms.dto.CourseRequest;
import com.lms.dto.ModuleRequest;
import com.lms.entity.User;
import com.lms.repository.UserRepository;
import com.lms.service.AssessmentService;
import com.lms.service.CourseService;
import com.lms.service.ModuleService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
public class QuizAttachmentTest {

    @Autowired
    private AssessmentService assessmentService;

    @Autowired
    private ModuleService moduleService;

    @Autowired
    private CourseService courseService;

    @Autowired
    private UserRepository userRepository;

    private void loginAs(String email, String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null,
                        List.of(new SimpleGrantedAuthority(role))));
    }

    private Long userId(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return user.getId();
    }

    private Long createCourse(String title) {
        loginAs("vikram.singh@lms.com", "ROLE_INSTRUCTOR");
        CourseRequest request = new CourseRequest();
        request.setTitle(title);
        request.setDescription("d");
        request.setInstructorId(userId("vikram.singh@lms.com"));
        request.setEstimateDuration(10);
        request.setLevel("beginner");
        request.setEnrollmentMode("open");
        return courseService.create(request).getId();
    }

    private Long createModule(Long courseId) {
        loginAs("vikram.singh@lms.com", "ROLE_INSTRUCTOR");
        ModuleRequest request = new ModuleRequest();
        request.setTitle("M1");
        request.setDisplayOrder(1);
        request.setIsRequired(true);
        return moduleService.create(courseId, request).getId();
    }

    private AssessmentRequest quizRequest(Long courseId, Long moduleId) {
        AssessmentRequest request = new AssessmentRequest();
        request.setModuleId(moduleId);
        request.setTitle("Quiz");
        request.setPassingScore(60);
        request.setMaxAttempts(3);
        return request;
    }

    @Test
    public void quizWithoutModuleAttachesToCourse() {
        loginAs("vikram.singh@lms.com", "ROLE_INSTRUCTOR");
        Long courseId = createCourse("Course Quiz");

        var quiz = assessmentService.create(courseId, quizRequest(courseId, null));

        assertEquals(courseId, quiz.getCourseId());
        assertNull(quiz.getModuleId());
    }

    @Test
    public void quizWithModuleAttachesToModule() {
        loginAs("vikram.singh@lms.com", "ROLE_INSTRUCTOR");
        Long courseId = createCourse("Module Quiz");
        Long moduleId = createModule(courseId);

        var quiz = assessmentService.create(courseId, quizRequest(courseId, moduleId));

        assertEquals(courseId, quiz.getCourseId());
        assertEquals(moduleId, quiz.getModuleId());
    }

    @Test
    public void quizRejectsForeignModule() {
        loginAs("vikram.singh@lms.com", "ROLE_INSTRUCTOR");
        Long courseA = createCourse("Course A");
        Long courseB = createCourse("Course B");
        Long foreignModuleId = createModule(courseB);

        assertThrows(RuntimeException.class,
                () -> assessmentService.create(courseA, quizRequest(courseA, foreignModuleId)));
    }
}
