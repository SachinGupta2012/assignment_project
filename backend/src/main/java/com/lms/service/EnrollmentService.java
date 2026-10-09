package com.lms.service;

import java.util.List;
import java.util.Set;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dto.EnrollmentRequest;
import com.lms.dto.EnrollmentResponse;
import com.lms.entity.Course;
import com.lms.entity.Enrollment;
import com.lms.entity.User;
import com.lms.repository.CourseRepository;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.UserRepository;

@Service
public class EnrollmentService {

    private static final Set<String> ALLOWED_STATUSES = Set.of("pending", "approved", "rejected");

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             CourseRepository courseRepository,
                             UserRepository userRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    // POST api foro /api/courses/{courseId}/enrollments
    @Transactional
    public EnrollmentResponse enroll(Long courseId, EnrollmentRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: "+ courseId));

        User learner = userRepository.findById(request.getLearnerId())
                .orElseThrow(() -> new RuntimeException("Learner not found: "+ request.getLearnerId()));

        if (enrollmentRepository.existsByUserIdAndCourseId(learner.getId(), courseId)) {
            throw new RuntimeException("Learner is already enrolled in this course");
        }

        User currentUser = getCurrentUser();

        Enrollment enrollment = new Enrollment();
        enrollment.setCourse(course);
        enrollment.setUser(learner);
        enrollment.setStatus("pending");
        enrollment.setDueDate(request.getDueDate());
        enrollment.setCreatedBy(currentUser);
        enrollment.setUpdatedBy(currentUser);

        Enrollment saved = enrollmentRepository.save(enrollment);
        return toResponse(saved);
    }

    // GET api for/api/courses/{courseId}/enrollments
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getByCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Course not found: " + courseId);
        }
        return enrollmentRepository.findByCourseId(courseId).stream()
                .map(this::toResponse)
                .toList();
    }

    // PATCH  api for/api/enrollments/{enrollmentId}?status=approved
    @Transactional
    public EnrollmentResponse updateStatus(Long enrollmentId, String status) {
        if (!ALLOWED_STATUSES.contains(status)) {
            throw new RuntimeException("Invalid status: " + status + " (allowed: pending, approved, rejected)");
        }
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found: " + enrollmentId));
        enrollment.setStatus(status);
        enrollment.setUpdatedBy(getCurrentUser());
        return toResponse(enrollment);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged-in user not found"));
    }

    private EnrollmentResponse toResponse(Enrollment e) {
        User learner = e.getUser();
        String learnerName = learner.getFirstName() + " " + learner.getLastName();
        return new EnrollmentResponse(
                e.getId(),e.getCourse().getId(),learner.getId(),learnerName,e.getStatus(),e.getDueDate(),
                e.getEnrolledAt()
        );
    }
}