package com.lms.service;

import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dto.ModuleRequest;
import com.lms.dto.ModuleResponse;
import com.lms.entity.Course;
import com.lms.entity.CourseModule;
import com.lms.entity.User;
import com.lms.repository.CourseModuleRepository;
import com.lms.repository.CourseRepository;
import com.lms.repository.UserRepository;

@Service
public class ModuleService {

    private final CourseModuleRepository moduleRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public ModuleService(CourseModuleRepository moduleRepository,
                         CourseRepository courseRepository,
                         UserRepository userRepository) {
        this.moduleRepository = moduleRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    // POST /api/courses/{courseId}/modules
    @Transactional
    public ModuleResponse create(Long courseId, ModuleRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        User currentUser = getCurrentUser();

        CourseModule module = new CourseModule();
        module.setCourse(course);
        module.setTitle(request.getTitle());
        module.setDescription(request.getDescription());
        module.setDisplayOrder(request.getDisplayOrder());
        module.setIsRequired(request.getIsRequired() == null || request.getIsRequired());
        module.setCreatedBy(currentUser);
        module.setUpdatedBy(currentUser);

        CourseModule saved = moduleRepository.save(module);
        return toResponse(saved);
    }

    // GET /api/courses/{courseId}/modules
    @Transactional(readOnly = true)
    public List<ModuleResponse> getByCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Course not found: " + courseId);
        }
        return moduleRepository.findByCourseIdOrderByDisplayOrder(courseId).stream()
                .map(this::toResponse)
                .toList();
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged-in user not found"));
    }

    private ModuleResponse toResponse(CourseModule m) {
        return new ModuleResponse(
                m.getId(),
                m.getCourse().getId(),
                m.getTitle(),
                m.getDescription(),
                m.getDisplayOrder(),
                m.getIsRequired()
        );
    }
}