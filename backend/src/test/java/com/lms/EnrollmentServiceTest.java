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
import com.lms.entity.User;
import com.lms.repository.UserRepository;
import com.lms.service.CourseService;
import com.lms.service.EnrollmentService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
public class EnrollmentServiceTest {

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

    private Long instructorId() {
        User user = userRepository.findByEmail("vikram.singh@lms.com").orElseThrow();
        return user.getId();
    }

    private Long learnerId() {
        User user = userRepository.findByEmail("ananya.iyer@lms.com").orElseThrow();
        return user.getId();
    }

    private Long createCourse(String mode) {
        loginAs("vikram.singh@lms.com", "ROLE_INSTRUCTOR");
        CourseRequest request = new CourseRequest();
        request.setTitle("Enroll Course");
        request.setDescription("d");
        request.setInstructorId(instructorId());
        request.setEstimateDuration(10);
        request.setLevel("beginner");
        request.setEnrollmentMode(mode);
        return courseService.create(request).getId();
    }

    @Test
    public void enrollApproveAndDuplicateFails() {
        Long courseId = createCourse("open");

        loginAs("priya.sharma@lms.com", "ROLE_TRAINING_MANAGER");
        EnrollmentRequest request = new EnrollmentRequest();
        request.setLearnerId(learnerId());

        var enrollment = enrollmentService.enroll(courseId, request);
        assertEquals("pending", enrollment.getStatus());

        var approved = enrollmentService.updateStatus(enrollment.getId(), "approved");
        assertEquals("approved", approved.getStatus());

        assertThrows(RuntimeException.class, () -> enrollmentService.enroll(courseId, request));
    }

    @Test
    public void selfEnrollClosedCourseFails() {
        Long courseId = createCourse("instructor_approval");

        loginAs("ananya.iyer@lms.com", "ROLE_LEARNER");

        assertThrows(RuntimeException.class, () -> enrollmentService.selfEnroll(courseId));
    }
}
