package com.lms.service;

import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Set;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dto.CourseRequest;
import com.lms.dto.CourseResponse;
import com.lms.entity.Course;
import com.lms.entity.User;
import com.lms.repository.CourseRepository;
import com.lms.repository.UserRepository;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;

    public CourseService(CourseRepository courseRepository, UserRepository userRepository,
                         ActivityService activityService) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.activityService = activityService;
    }

    // POST for apicourses
    @Transactional
    public CourseResponse create(CourseRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged-in user not found"));
        User instructor = userRepository.findById(request.getInstructorId())
                .orElseThrow(() -> new RuntimeException("Instructor not found"));

        if(!Set.of("beginner","intermediate","advanced").contains(request.getLevel().toLowerCase())){
            throw new RuntimeException("Invalid level:"+request.getLevel());

        }
        if(!Set.of("open","self_enroll","instructor_approval").contains(request.getEnrollmentMode().toLowerCase())){
            throw new RuntimeException("Invalid enrollment mode:"+request.getEnrollmentMode());
        }

        Course course = new Course();
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setLevel(request.getLevel());
        course.setEnrollmentMode(request.getEnrollmentMode());
        course.setInstructor(instructor);
        course.setEstimatedDuration(request.getEstimateDuration());
        course.setCreatedBy(currentUser);    
        course.setUpdatedBy(currentUser);

        Course saved = courseRepository.save(course);
        activityService.record(currentUser, "COURSE_CREATED", "course", saved.getId());
        return toResponse(saved);
    }

    // GET for apicourses (learners see only published, non-archived courses)
    @Transactional(readOnly = true)
    public Page<CourseResponse> getAll(Pageable pageable) {
        if (hasRole("ROLE_LEARNER")) {
            return courseRepository.findByIsPublishedTrueAndIsArchivedFalse(pageable).map(this::toResponse);
        }
        return courseRepository.findAll(pageable).map(this::toResponse);
    }

    // GET /api/courses/search?title=&level=&instructorId=&published=&archived=&tag=
    @Transactional(readOnly = true)
    public Page<CourseResponse> search(String title, String level, Long instructorId,
                                       Boolean published, Boolean archived, String tag, Pageable pageable) {
        return courseRepository.search(title, level, instructorId, published, archived, tag, pageable)
                .map(this::toResponse);
    }

    // GET by id of courses (learners can only open published, non-archived courses)
    @Transactional(readOnly = true)
    public CourseResponse getById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found: " + id));
        if (hasRole("ROLE_LEARNER")
                && (!Boolean.TRUE.equals(course.getIsPublished())
                    || Boolean.TRUE.equals(course.getIsArchived()))) {
            throw new RuntimeException("Course not found: " + id);
        }
        return toResponse(course);
    }

    private CourseResponse toResponse(Course course) {
        String instructorName = course.getInstructor().getFirstName()
                + " " + course.getInstructor().getLastName();
        return new CourseResponse(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                instructorName,
                course.getIsPublished(),
                course.getEstimatedDuration(),
                course.getLevel(),
                course.getEnrollmentMode(),
                course.getIsArchived(),
                course.getTags()
        );
    }

    // PUT /api/courses/{id}
    @Transactional
    public CourseResponse update(Long id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found: " + id));
        validateLevelAndMode(request);
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setLevel(request.getLevel());
        course.setEnrollmentMode(request.getEnrollmentMode());
        course.setEstimatedDuration(request.getEstimateDuration());
        course.setUpdatedBy(getCurrentUserForUpdate());
        return toResponse(courseRepository.save(course));
    }

    // PATCH /api/courses/{id}/status?published=&archived=
    @Transactional
    public CourseResponse updateStatus(Long id, Boolean published, Boolean archived) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found: " + id));
        if (published != null) {
            course.setIsPublished(published);
        }
        if (archived != null) {
            course.setIsArchived(archived);
        }
        course.setUpdatedBy(getCurrentUserForUpdate());
        Course saved = courseRepository.save(course);
        activityService.record(saved.getUpdatedBy(), "COURSE_STATUS_CHANGED", "course", saved.getId());
        return toResponse(saved);
    }

    private void validateLevelAndMode(CourseRequest request) {
        if (!Set.of("beginner", "intermediate", "advanced").contains(request.getLevel().toLowerCase())) {
            throw new RuntimeException("Invalid level:" + request.getLevel());
        }
        if (!Set.of("open", "self_enroll", "instructor_approval").contains(request.getEnrollmentMode().toLowerCase())) {
            throw new RuntimeException("Invalid enrollment mode:" + request.getEnrollmentMode());
        }
    }

    private User getCurrentUserForUpdate() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged-in user not found"));
    }

    private boolean hasRole(String role) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        for (var authority : auth.getAuthorities()) {
            if (role.equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}