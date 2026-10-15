package com.lms;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dto.CourseRequest;
import com.lms.dto.EnrollmentRequest;
import com.lms.dto.LessonRequest;
import com.lms.dto.ModuleRequest;
import com.lms.entity.User;
import com.lms.repository.UserRepository;
import com.lms.service.CourseService;
import com.lms.service.EnrollmentService;
import com.lms.service.LessonService;
import com.lms.service.ModuleService;
import com.lms.service.ProgressService;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Transactional
public class ProgressServiceTest {

    @Autowired
    private ProgressService progressService;

    @Autowired
    private ModuleService moduleService;

    @Autowired
    private LessonService lessonService;

    @Autowired
    private EnrollmentService enrollmentService;

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

    private Long createLesson(Long courseId, Long moduleId, String title, int order) {
        LessonRequest request = new LessonRequest();
        request.setTitle(title);
        request.setContentType("text");
        request.setContentBody("hi");
        request.setDisplayOrder(order);
        request.setIsRequired(true);
        request.setDuration(5);
        return lessonService.create(courseId, moduleId, request).getId();
    }

    @Test
    public void completionRaisesProgress() {
        loginAs("vikram.singh@lms.com", "ROLE_INSTRUCTOR");
        CourseRequest courseRequest = new CourseRequest();
        courseRequest.setTitle("Progress Course");
        courseRequest.setDescription("d");
        courseRequest.setInstructorId(userId("vikram.singh@lms.com"));
        courseRequest.setEstimateDuration(10);
        courseRequest.setLevel("beginner");
        courseRequest.setEnrollmentMode("open");
        Long courseId = courseService.create(courseRequest).getId();

        ModuleRequest moduleRequest = new ModuleRequest();
        moduleRequest.setTitle("M1");
        moduleRequest.setDisplayOrder(1);
        moduleRequest.setIsRequired(true);
        Long moduleId = moduleService.create(courseId, moduleRequest).getId();

        Long firstLessonId = createLesson(courseId, moduleId, "L1", 1);
        createLesson(courseId, moduleId, "L2", 2);

        loginAs("priya.sharma@lms.com", "ROLE_TRAINING_MANAGER");
        EnrollmentRequest enrollRequest = new EnrollmentRequest();
        enrollRequest.setLearnerId(userId("ananya.iyer@lms.com"));
        Long enrollmentId = enrollmentService.enroll(courseId, enrollRequest).getId();
        enrollmentService.updateStatus(enrollmentId, "approved");

        loginAs("ananya.iyer@lms.com", "ROLE_LEARNER");
        assertEquals("L1", progressService.resume(courseId).getTitle());

        progressService.completeLesson(firstLessonId);

        assertEquals(50, progressService.getProgress(courseId, null).getPercentage());
        assertEquals("L2", progressService.resume(courseId).getTitle());
    }
}
