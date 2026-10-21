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
import com.lms.repository.AssessmentRepository;
import com.lms.repository.LessonCompletionRepository;
import com.lms.repository.UserRepository;

@Service
public class ModuleService {

    private final CourseModuleRepository moduleRepository;
    private final CourseRepository courseRepository;
    private final AssessmentRepository assessmentRepository;
    private final LessonCompletionRepository completionRepository;
    private final UserRepository userRepository;

    public ModuleService(CourseModuleRepository moduleRepository,
                         CourseRepository courseRepository,
                         AssessmentRepository assessmentRepository,
                         LessonCompletionRepository completionRepository,
                         UserRepository userRepository) {
        this.moduleRepository = moduleRepository;
        this.courseRepository = courseRepository;
        this.assessmentRepository = assessmentRepository;
        this.completionRepository = completionRepository;
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
        course.getModules().add(module);
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

    // PUT /api/courses/{courseId}/modules/{moduleId} (edit + reorder, progress-safe:
    // displayOrder changes never touch completions, which reference lesson ids)
    @Transactional
    public ModuleResponse update(Long courseId, Long moduleId, ModuleRequest request) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found: " + moduleId));
        if (!module.getCourse().getId().equals(courseId)) {
            throw new RuntimeException("Module " + moduleId + " does not belong to course " + courseId);
        }
        module.setTitle(request.getTitle());
        module.setDescription(request.getDescription());
        module.setDisplayOrder(request.getDisplayOrder());
        module.setIsRequired(request.getIsRequired() == null || request.getIsRequired());
        module.setUpdatedBy(getCurrentUser());
        return toResponse(moduleRepository.save(module));
    }

    @Transactional
    public void delete(Long courseId, Long moduleId) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found: " + moduleId));
        if (!module.getCourse().getId().equals(courseId)) {
            throw new RuntimeException("Module " + moduleId + " does not belong to course " + courseId);
        }
        if (Boolean.TRUE.equals(module.getCourse().getIsPublished())) {
            throw new RuntimeException("Unpublish the course before deleting modules");
        }
        if (assessmentRepository.existsByModuleId(moduleId)) {
            throw new RuntimeException("Move or delete this module's assessments first");
        }
        if (completionRepository.existsByLessonModuleId(moduleId)) {
            throw new RuntimeException("This module has learner progress and cannot be deleted");
        }
        moduleRepository.delete(module);
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
