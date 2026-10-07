package com.lms.service;

import com.lms.dto.LessonRequest;
import com.lms.dto.LessonResponse;
import com.lms.entity.CourseModule;
import com.lms.entity.Lesson;
import com.lms.entity.User;
import com.lms.repository.CourseModuleRepository;
import com.lms.repository.LessonRepository;
import com.lms.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class LessonService {

    private static final Set<String> ALLOWED_TYPES = Set.of("text", "video", "link", "quiz");

    private final LessonRepository lessonRepository;
    private final CourseModuleRepository moduleRepository;
    private final UserRepository userRepository;

    public LessonService(LessonRepository lessonRepository,
                         CourseModuleRepository moduleRepository,
                         UserRepository userRepository) {
        this.lessonRepository = lessonRepository;
        this.moduleRepository = moduleRepository;
        this.userRepository = userRepository;
    }

    // POST /api/courses/{courseId}/modules/{moduleId}/lessons
    @Transactional
    public LessonResponse create(Long courseId, Long moduleId, LessonRequest request) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found: " + moduleId));

        
        if (!module.getCourse().getId().equals(courseId)) {     //(it checks whether the module belongs to any course or not)
            throw new RuntimeException("Module " + moduleId + " does not belong to course " + courseId);
        }

        String contentType = request.getContentType() == null || request.getContentType().isBlank()
                ? "text" : request.getContentType().toLowerCase();
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new RuntimeException("Invalid content type: " + contentType
                    + " (allowed: text, video, link, quiz)");
        }

        User currentUser = getCurrentUser();

        Lesson lesson = new Lesson();
        lesson.setModule(module);
        lesson.setTitle(request.getTitle());
        lesson.setContentType(contentType);
        lesson.setContentUrl(request.getContentUrl());
        lesson.setContentBody(request.getContentBody());
        lesson.setDisplayOrder(request.getDisplayOrder());
        lesson.setIsRequired(request.getIsRequired() == null || request.getIsRequired());
        lesson.setDurationMinutes(request.getDuration());
        lesson.setCreatedBy(currentUser);
        lesson.setUpdatedBy(currentUser);

        Lesson saved = lessonRepository.save(lesson);
        return toResponse(saved);
    }

    // GET /api/courses/{courseId}/modules/{moduleId}/lessons
    @Transactional(readOnly = true)
    public List<LessonResponse> getByModule(Long courseId, Long moduleId) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found: " + moduleId));
        if (!module.getCourse().getId().equals(courseId)) {
            throw new RuntimeException("Module " + moduleId + " does not belong to course " + courseId);
        }
        return lessonRepository.findByModuleIdOrderByDisplayOrder(moduleId).stream()
                .map(this::toResponse)
                .toList();
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged-in user not found"));
    }

    private LessonResponse toResponse(Lesson l) {
        return new LessonResponse(
                l.getId(),
                l.getModule().getId(),
                l.getTitle(),
                l.getContentType(),
                l.getContentUrl(),
                l.getContentBody(),
                l.getDisplayOrder(),
                l.getIsRequired(),
                l.getDurationMinutes()
        );
    }
}