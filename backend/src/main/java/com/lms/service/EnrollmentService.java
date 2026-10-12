package com.lms.service;

import java.util.List;
import java.util.Set;
import java.time.LocalDateTime;
import java.util.ArrayList;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private final NotificationService notificationService;
    private final ActivityService activityService;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             CourseRepository courseRepository,
                             UserRepository userRepository,
                             NotificationService notificationService,
                             ActivityService activityService) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.activityService = activityService;
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

        notificationService.create(learner, "ENROLLMENT",
                "Enrolled in " + course.getTitle(),
                "You have been enrolled in " + course.getTitle() + " by " + currentUser.getEmail());

        activityService.record(currentUser, "ENROLLMENT_CREATED", "enrollment", saved.getId());

        return toResponse(saved);
    }

    // GET /api/courses/{courseId}/enrollments
    @Transactional(readOnly = true)
    public Page<EnrollmentResponse> getByCourse(Long courseId, Pageable pageable) {
        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Course not found: " + courseId);
        }
        return enrollmentRepository.findByCourseId(courseId, pageable).map(this::toResponse);
    }

    // POST /api/courses/{courseId}/self-enroll
    @Transactional
    public EnrollmentResponse selfEnroll(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));
        String mode = course.getEnrollmentMode() == null ? "" : course.getEnrollmentMode().toLowerCase();
        if (!"open".equals(mode) && !"self_enroll".equals(mode)) {
            throw new RuntimeException("This course does not allow self-enrollment");
        }
        if (!Boolean.TRUE.equals(course.getIsPublished()) || Boolean.TRUE.equals(course.getIsArchived())) {
            throw new RuntimeException("This course is not available for enrollment");
        }
        User learner = getCurrentUser();
        if (enrollmentRepository.existsByUserIdAndCourseId(learner.getId(), courseId)) {
            throw new RuntimeException("Learner is already enrolled in this course");
        }
        Enrollment enrollment = new Enrollment();
        enrollment.setCourse(course);
        enrollment.setUser(learner);
        enrollment.setStatus("approved");
        enrollment.setCreatedBy(learner);
        enrollment.setUpdatedBy(learner);
        Enrollment saved = enrollmentRepository.save(enrollment);
        return toResponse(saved);
    }

    // GET /api/enrollments/me?view=current|overdue|all
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> myEnrollments(String view) {
        User learner = getCurrentUser();
        List<Enrollment> all = enrollmentRepository.findByUserId(learner.getId());
        List<EnrollmentResponse> out = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (Enrollment enrollment : all) {
            boolean overdue = enrollment.getDueDate() != null
                    && enrollment.getDueDate().isBefore(now)
                    && "approved".equals(enrollment.getStatus());
            if ("overdue".equals(view) && !overdue) {
                continue;
            }
            if ("current".equals(view) && (overdue || !"approved".equals(enrollment.getStatus()))) {
                continue;
            }
            out.add(toResponse(enrollment));
        }
        return out;
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