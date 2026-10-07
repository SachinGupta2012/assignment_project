package com.lms.service;

import java.util.List;
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

    public CourseService(CourseRepository courseRepository, UserRepository userRepository) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
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
        return toResponse(saved);
    }

    // GET for apicourses
    @Transactional(readOnly = true)
    public List<CourseResponse> getAll() {
        return courseRepository.findAll().stream().map(this::toResponse).toList();
    }

    // GET by id of courses
    @Transactional(readOnly = true)
    public CourseResponse getById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found: " + id));
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
                course.getEnrollmentMode()
        );
    }
}