package com.lms.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dto.AssessmentRequest;
import com.lms.dto.AssessmentResponse;
import com.lms.dto.QuestionDetailResponse;
import com.lms.dto.QuestionRequest;
import com.lms.dto.QuestionResponse;
import com.lms.entity.Assessment;
import com.lms.entity.Course;
import com.lms.entity.CourseModule;
import com.lms.entity.Question;
import com.lms.entity.QuestionOption;
import com.lms.entity.User;
import com.lms.repository.AssessmentRepository;
import com.lms.repository.AssessmentAttemptRepository;
import com.lms.repository.CourseModuleRepository;
import com.lms.repository.CourseRepository;
import com.lms.repository.QuestionOptionRepository;
import com.lms.repository.QuestionRepository;
import com.lms.repository.UserRepository;

@Service
public class AssessmentService {

    private static final Set<String> TYPES = Set.of("single_choice", "multiple_choice", "short_answer");

    private final AssessmentRepository assessmentRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository optionRepository;
    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final UserRepository userRepository;

    public AssessmentService(AssessmentRepository assessmentRepository,
                             AssessmentAttemptRepository attemptRepository,
                             QuestionRepository questionRepository,
                             QuestionOptionRepository optionRepository,
                             CourseRepository courseRepository,
                             CourseModuleRepository moduleRepository,
                             UserRepository userRepository) {
        this.assessmentRepository = assessmentRepository;
        this.attemptRepository = attemptRepository;
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
        this.courseRepository = courseRepository;
        this.moduleRepository = moduleRepository;
        this.userRepository = userRepository;
    }

    // POST /api/courses/{courseId}/assessments
    @Transactional
    public AssessmentResponse create(Long courseId, AssessmentRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        CourseModule module = null;
        if (request.getModuleId() != null) {
            module = moduleRepository.findById(request.getModuleId())
                    .orElseThrow(() -> new RuntimeException("Module not found: " + request.getModuleId()));
            if (!module.getCourse().getId().equals(courseId)) {
                throw new RuntimeException("Module " + module.getId() + " does not belong to course " + courseId);
            }
        }

        User currentUser = getCurrentUser();

        Assessment assessment = new Assessment();
        assessment.setCourse(course);
        assessment.setModule(module);
        assessment.setTitle(request.getTitle());
        assessment.setDescription(request.getDescription());
        assessment.setPassingScore(BigDecimal.valueOf(request.getPassingScore()));
        assessment.setMaxScore(BigDecimal.ZERO);
        assessment.setTimeLimitMinutes(request.getTimeLimitMinutes());
        assessment.setMaxAttempts(request.getMaxAttempts());
        assessment.setIsRequired(true);
        assessment.setDisplayOrder(request.getDisplayOrder());
        assessment.setCreatedBy(currentUser);
        assessment.setUpdatedBy(currentUser);

        Assessment saved = assessmentRepository.save(assessment);
        return toResponse(saved);
    }

    @Transactional
    public AssessmentResponse update(Long courseId, Long assessmentId, AssessmentRequest request) {
        Assessment assessment = getCourseAssessment(courseId, assessmentId);
        if (attemptRepository.existsByAssessmentId(assessmentId)) {
            throw new RuntimeException("Assessments with learner attempts cannot be edited");
        }
        CourseModule module = resolveModule(courseId, request.getModuleId());
        assessment.setModule(module);
        assessment.setTitle(request.getTitle());
        assessment.setDescription(request.getDescription());
        assessment.setPassingScore(BigDecimal.valueOf(request.getPassingScore()));
        assessment.setTimeLimitMinutes(request.getTimeLimitMinutes());
        assessment.setMaxAttempts(request.getMaxAttempts());
        assessment.setDisplayOrder(request.getDisplayOrder());
        assessment.setUpdatedBy(getCurrentUser());
        return toResponse(assessmentRepository.save(assessment));
    }

    @Transactional
    public void delete(Long courseId, Long assessmentId) {
        Assessment assessment = getCourseAssessment(courseId, assessmentId);
        if (Boolean.TRUE.equals(assessment.getCourse().getIsPublished())) {
            throw new RuntimeException("Unpublish the course before deleting assessments");
        }
        if (attemptRepository.existsByAssessmentId(assessmentId)) {
            throw new RuntimeException("This assessment has learner attempts and cannot be deleted");
        }
        assessmentRepository.delete(assessment);
    }

    // GET /api/courses/{courseId}/assessments
    @Transactional(readOnly = true)
    public Page<AssessmentResponse> getByCourse(Long courseId, Pageable pageable) {
        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Course not found: " + courseId);
        }
        return assessmentRepository.findByCourseId(courseId, pageable).map(this::toResponse);
    }

    // POST /api/assessments/{assessmentId}/questions
    @Transactional
    public QuestionDetailResponse addQuestion(Long assessmentId, QuestionRequest request) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new RuntimeException("Assessment not found: " + assessmentId));

        String type = request.getQuestionType() == null ? "single_choice" : request.getQuestionType();
        if (!TYPES.contains(type)) {
            throw new RuntimeException("Invalid question type: " + type
                    + " (allowed: single_choice, multiple_choice, short_answer)");
        }

        List<QuestionRequest.OptionItem> options = request.getOptions() == null
                ? new ArrayList<>() : request.getOptions();

        if ("short_answer".equals(type)) {
            if (request.getCorrectAnswer() == null || request.getCorrectAnswer().isBlank()) {
                throw new RuntimeException("Short-answer questions need a correctAnswer for the grading queue");
            }
        } else {
            if (options.size() < 2) {
                throw new RuntimeException("Choice questions need at least 2 options");
            }
            int correctCount = 0;
            for (QuestionRequest.OptionItem option : options) {
                if (Boolean.TRUE.equals(option.getIsCorrect())) {
                    correctCount++;
                }
            }
            if ("single_choice".equals(type) && correctCount != 1) {
                throw new RuntimeException("Single-choice questions need exactly 1 correct option");
            }
            if ("multiple_choice".equals(type) && correctCount < 1) {
                throw new RuntimeException("Multiple-choice questions need at least 1 correct option");
            }
        }

        User currentUser = getCurrentUser();

        Question question = new Question();
        question.setAssessment(assessment);
        assessment.getQuestions().add(question);
        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(type);
        question.setPoints(request.getPoints());
        question.setCorrectAnswer(request.getCorrectAnswer());
        question.setExplanation(request.getExplanation());
        question.setDisplayOrder(request.getDisplayOrder());
        question.setCreatedBy(currentUser);
        question.setUpdatedBy(currentUser);

        for (QuestionRequest.OptionItem item : options) {
            QuestionOption option = new QuestionOption();
            option.setQuestion(question);
            option.setOptionText(item.getOptionText());
            option.setIsCorrect(item.getIsCorrect() == null ? false : item.getIsCorrect());
            option.setDisplayOrder(item.getDisplayOrder());
            question.getOptions().add(option);
        }

        Question saved = questionRepository.save(question);

        assessment.setMaxScore(assessment.getMaxScore().add(request.getPoints()));
        assessment.setUpdatedBy(currentUser);
        assessmentRepository.save(assessment);

        return toDetailResponse(saved);
    }

    // GET /api/assessments/{assessmentId}/questions (learner-safe, no answer key)
    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestions(Long assessmentId) {
        if (!assessmentRepository.existsById(assessmentId)) {
            throw new RuntimeException("Assessment not found: " + assessmentId);
        }
        List<QuestionResponse> out = new ArrayList<>();
        List<Question> questions = questionRepository.findByAssessmentIdOrderByDisplayOrder(assessmentId);
        for (Question question : questions) {
            out.add(toSafeResponse(question));
        }
        return out;
    }

    // GET /api/assessments/{assessmentId}/questions/with-answers (instructor only)
    @Transactional(readOnly = true)
    public List<QuestionDetailResponse> getQuestionsWithAnswers(Long assessmentId) {
        if (!assessmentRepository.existsById(assessmentId)) {
            throw new RuntimeException("Assessment not found: " + assessmentId);
        }
        List<QuestionDetailResponse> out = new ArrayList<>();
        List<Question> questions = questionRepository.findByAssessmentIdOrderByDisplayOrder(assessmentId);
        for (Question question : questions) {
            out.add(toDetailResponse(question));
        }
        return out;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged-in user not found"));
    }

    private Assessment getCourseAssessment(Long courseId, Long assessmentId) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new RuntimeException("Assessment not found: " + assessmentId));
        if (!assessment.getCourse().getId().equals(courseId)) {
            throw new RuntimeException("Assessment " + assessmentId + " does not belong to course " + courseId);
        }
        return assessment;
    }

    private CourseModule resolveModule(Long courseId, Long moduleId) {
        if (moduleId == null) return null;
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found: " + moduleId));
        if (!module.getCourse().getId().equals(courseId)) {
            throw new RuntimeException("Module " + moduleId + " does not belong to course " + courseId);
        }
        return module;
    }

    private AssessmentResponse toResponse(Assessment a) {
        Long moduleId = a.getModule() == null ? null : a.getModule().getId();
        return new AssessmentResponse(
                a.getId(),
                a.getCourse().getId(),
                moduleId,
                a.getTitle(),
                a.getDescription(),
                a.getPassingScore(),
                a.getMaxScore(),
                a.getTimeLimitMinutes(),
                a.getMaxAttempts(),
                a.getIsRequired(),
                a.getDisplayOrder(),
                a.getCreatedAt()
        );
    }

    private QuestionResponse toSafeResponse(Question q) {
        List<QuestionResponse.OptionResponse> options = new ArrayList<>();
        for (QuestionOption option : optionRepository.findByQuestionIdOrderByDisplayOrder(q.getId())) {
            options.add(new QuestionResponse.OptionResponse(
                    option.getId(), option.getOptionText(), option.getDisplayOrder()));
        }
        return new QuestionResponse(q.getId(), q.getQuestionText(), q.getQuestionType(),
                q.getPoints(), q.getDisplayOrder(), options);
    }

    private QuestionDetailResponse toDetailResponse(Question q) {
        List<QuestionDetailResponse.OptionDetail> options = new ArrayList<>();
        for (QuestionOption option : optionRepository.findByQuestionIdOrderByDisplayOrder(q.getId())) {
            options.add(new QuestionDetailResponse.OptionDetail(
                    option.getId(), option.getOptionText(), option.getIsCorrect(), option.getDisplayOrder()));
        }
        return new QuestionDetailResponse(q.getId(), q.getQuestionText(), q.getQuestionType(),
                q.getPoints(), q.getCorrectAnswer(), q.getExplanation(), q.getDisplayOrder(), options);
    }
}
