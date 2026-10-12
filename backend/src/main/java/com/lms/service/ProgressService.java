package com.lms.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dto.LessonCompletionResponse;
import com.lms.dto.LessonResponse;
import com.lms.dto.ProgressResponse;
import com.lms.entity.Assessment;
import com.lms.entity.AssessmentAttempt;
import com.lms.entity.Course;
import com.lms.entity.CourseModule;
import com.lms.entity.Enrollment;
import com.lms.entity.Lesson;
import com.lms.entity.LessonCompletion;
import com.lms.entity.User;
import com.lms.repository.AssessmentAttemptRepository;
import com.lms.repository.AssessmentRepository;
import com.lms.repository.CourseModuleRepository;
import com.lms.repository.CourseRepository;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.LessonCompletionRepository;
import com.lms.repository.LessonRepository;
import com.lms.repository.UserRepository;

@Service
public class ProgressService {

    private final LessonCompletionRepository completionRepository;
    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;
    private final AssessmentRepository assessmentRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;
    private final CourseModuleRepository moduleRepository;

    public ProgressService(LessonCompletionRepository completionRepository,
                           LessonRepository lessonRepository,
                           CourseRepository courseRepository,
                           AssessmentRepository assessmentRepository,
                           AssessmentAttemptRepository attemptRepository,
                           EnrollmentRepository enrollmentRepository,
                           UserRepository userRepository,
                           ActivityService activityService,
                           CourseModuleRepository moduleRepository) {
        this.completionRepository = completionRepository;
        this.lessonRepository = lessonRepository;
        this.courseRepository = courseRepository;
        this.assessmentRepository = assessmentRepository;
        this.attemptRepository = attemptRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.activityService = activityService;
        this.moduleRepository = moduleRepository;
    }

    // POST /api/lessons/{lessonId}/complete
    @Transactional
    public LessonCompletionResponse completeLesson(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found: " + lessonId));
        User learner = getCurrentUser();

        Long courseId = lesson.getModule().getCourse().getId();
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(learner.getId(), courseId)
                .orElseThrow(() -> new RuntimeException("You are not enrolled in this course"));
        if (!"approved".equals(enrollment.getStatus())) {
            throw new RuntimeException("Your enrollment is not approved yet");
        }
        if (completionRepository.existsByLessonIdAndLearnerId(lessonId, learner.getId())) {
            throw new RuntimeException("Lesson already completed");
        }

        LessonCompletion completion = new LessonCompletion();
        completion.setLesson(lesson);
        completion.setLearner(learner);
        completion.setCompletedAt(LocalDateTime.now());
        LessonCompletion saved = completionRepository.save(completion);

        activityService.record(learner, "LESSON_COMPLETED", "lesson", lessonId);

        return new LessonCompletionResponse(lessonId, learner.getId(), saved.getCompletedAt());
    }

    // GET /api/courses/{courseId}/progress?learnerId=
    @Transactional(readOnly = true)
    public ProgressResponse getProgress(Long courseId, Long learnerId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));
        User me = getCurrentUser();

        User learner;
        if (learnerId == null) {
            learner = me;
        } else {
            if (!hasRole("ROLE_ADMIN") && !hasRole("ROLE_TRAINING_MANAGER") && !me.getId().equals(learnerId)) {
                throw new RuntimeException("You can only view your own progress");
            }
            learner = userRepository.findById(learnerId)
                    .orElseThrow(() -> new RuntimeException("Learner not found: " + learnerId));
        }

        int lessonsTotal = 0;
        int lessonsDone = 0;
        for (CourseModule module : course.getModules()) {
            for (Lesson lesson : module.getLessons()) {
                if (Boolean.TRUE.equals(lesson.getIsRequired())) {
                    lessonsTotal++;
                    if (completionRepository.existsByLessonIdAndLearnerId(lesson.getId(), learner.getId())) {
                        lessonsDone++;
                    }
                }
            }
        }

        int assessmentsTotal = 0;
        int assessmentsPassed = 0;
        List<Assessment> assessments = assessmentRepository.findByCourseIdOrderByDisplayOrder(courseId);
        for (Assessment assessment : assessments) {
            if (Boolean.TRUE.equals(assessment.getIsRequired())) {
                assessmentsTotal++;
                List<AssessmentAttempt> attempts = attemptRepository
                        .findByAssessmentIdAndLearnerIdOrderByAttemptNumberAsc(assessment.getId(), learner.getId());
                for (AssessmentAttempt attempt : attempts) {
                    if ("graded".equals(attempt.getStatus()) && Boolean.TRUE.equals(attempt.getPassed())) {
                        assessmentsPassed++;
                        break;
                    }
                }
            }
        }

        int total = lessonsTotal + assessmentsTotal;
        int done = lessonsDone + assessmentsPassed;
        int percentage = total == 0 ? 0 : (done * 100) / total;

        return new ProgressResponse(courseId, learner.getId(), lessonsTotal, lessonsDone,
                assessmentsTotal, assessmentsPassed, percentage);
    }

    // GET /api/courses/{courseId}/resume (first required incomplete lesson, in order)
    @Transactional(readOnly = true)
    public LessonResponse resume(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Course not found: " + courseId);
        }
        User learner = getCurrentUser();

        List<CourseModule> modules = moduleRepository.findByCourseIdOrderByDisplayOrder(courseId);
        for (CourseModule module : modules) {
            List<Lesson> lessons = new ArrayList<>(module.getLessons());
            lessons.sort(Comparator.comparing(Lesson::getDisplayOrder));
            for (Lesson lesson : lessons) {
                if (Boolean.TRUE.equals(lesson.getIsRequired())
                        && !completionRepository.existsByLessonIdAndLearnerId(lesson.getId(), learner.getId())) {
                    return new LessonResponse(
                            lesson.getId(),
                            module.getId(),
                            lesson.getTitle(),
                            lesson.getContentType(),
                            lesson.getContentUrl(),
                            lesson.getContentBody(),
                            lesson.getDisplayOrder(),
                            lesson.getIsRequired(),
                            lesson.getDurationMinutes()
                    );
                }
            }
        }
        throw new RuntimeException("All required lessons are complete");
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

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged-in user not found"));
    }
}
