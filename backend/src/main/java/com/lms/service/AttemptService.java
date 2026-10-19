package com.lms.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dto.AttemptAnswerResponse;
import com.lms.dto.AttemptResponse;
import com.lms.dto.AttemptSubmitRequest;
import com.lms.entity.Assessment;
import com.lms.entity.AssessmentAttempt;
import com.lms.entity.AttemptAnswer;
import com.lms.entity.Enrollment;
import com.lms.entity.Question;
import com.lms.entity.QuestionOption;
import com.lms.entity.User;
import com.lms.repository.AssessmentAttemptRepository;
import com.lms.repository.AssessmentRepository;
import com.lms.repository.AttemptAnswerRepository;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.QuestionRepository;
import com.lms.repository.UserRepository;

@Service
public class AttemptService {

    private final AssessmentAttemptRepository attemptRepository;
    private final AttemptAnswerRepository answerRepository;
    private final AssessmentRepository assessmentRepository;
    private final QuestionRepository questionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ActivityService activityService;
    private final ProgressService progressService;

    public AttemptService(AssessmentAttemptRepository attemptRepository,
                          AttemptAnswerRepository answerRepository,
                          AssessmentRepository assessmentRepository,
                          QuestionRepository questionRepository,
                          EnrollmentRepository enrollmentRepository,
                          UserRepository userRepository,
                          NotificationService notificationService,
                          ActivityService activityService,
                          ProgressService progressService) {
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
        this.assessmentRepository = assessmentRepository;
        this.questionRepository = questionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.activityService = activityService;
        this.progressService = progressService;
    }

    // POST /api/assessments/{assessmentId}/attempts
    @Transactional
    public AttemptResponse start(Long assessmentId) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new RuntimeException("Assessment not found: " + assessmentId));
        User learner = getCurrentUser();

        Enrollment enrollment = enrollmentRepository
                .findByUserIdAndCourseId(learner.getId(), assessment.getCourse().getId())
                .orElseThrow(() -> new RuntimeException("You are not enrolled in this course"));
        if (!"approved".equals(enrollment.getStatus()) && !"completed".equals(enrollment.getStatus())) {
            throw new RuntimeException("Your enrollment is not approved yet");
        }

        long used = attemptRepository.countByAssessmentIdAndLearnerId(assessmentId, learner.getId());
        if (used >= assessment.getMaxAttempts()) {
            throw new RuntimeException("No attempts left (max " + assessment.getMaxAttempts() + ")");
        }

        AssessmentAttempt attempt = new AssessmentAttempt();
        attempt.setAssessment(assessment);
        attempt.setLearner(learner);
        attempt.setAttemptNumber((int) used + 1);
        attempt.setStatus("in_progress");

        AssessmentAttempt saved = attemptRepository.save(attempt);
        return toResponse(saved);
    }

    // GET /api/assessments/{assessmentId}/attempts/me
    @Transactional(readOnly = true)
    public List<AttemptResponse> myAttempts(Long assessmentId) {
        User learner = getCurrentUser();
        List<AttemptResponse> out = new ArrayList<>();
        List<AssessmentAttempt> attempts = attemptRepository
                .findByAssessmentIdAndLearnerIdOrderByAttemptNumberAsc(assessmentId, learner.getId());
        for (AssessmentAttempt attempt : attempts) {
            out.add(toResponse(attempt));
        }
        return out;
    }

    // GET /api/attempts/{attemptId}/answers
    @Transactional(readOnly = true)
    public List<AttemptAnswerResponse> getAnswers(Long attemptId) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found: " + attemptId));
        User me = getCurrentUser();
        if (!attempt.getLearner().getId().equals(me.getId()) && !hasRole("ROLE_ADMIN")) {
            throw new RuntimeException("You can only view your own attempt");
        }
        return answerRepository.findByAttemptId(attemptId).stream()
                .map(this::toAnswerResponse)
                .toList();
    }

    // PATCH /api/attempts/{attemptId}/answers (save draft, attempt stays in_progress)
    @Transactional
    public AttemptResponse saveDraft(Long attemptId, AttemptSubmitRequest request) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found: " + attemptId));
        User me = getCurrentUser();

        boolean admin = hasRole("ROLE_ADMIN");
        if (!attempt.getLearner().getId().equals(me.getId()) && !admin) {
            throw new RuntimeException("You can only edit your own attempt");
        }
        if (!"in_progress".equals(attempt.getStatus())) {
            throw new RuntimeException("Attempt already submitted — submitted responses cannot be edited");
        }
        requireWithinTime(attempt);

        Assessment assessment = attempt.getAssessment();
        List<AttemptAnswer> rows = new ArrayList<>();
        Set<Long> savedQuestions = new HashSet<>();

        for (AttemptSubmitRequest.AnswerItem item : request.getAnswers()) {
            if (!savedQuestions.add(item.getQuestionId())) {
                throw new RuntimeException("Question " + item.getQuestionId() + " was answered more than once");
            }
            Question question = questionRepository.findById(item.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found: " + item.getQuestionId()));
            if (!question.getAssessment().getId().equals(assessment.getId())) {
                throw new RuntimeException("Question " + question.getId() + " does not belong to this assessment");
            }
            String type = question.getQuestionType();

            if ("short_answer".equals(type)) {
                AttemptAnswer row = new AttemptAnswer();
                row.setAttempt(attempt);
                row.setQuestion(question);
                row.setQuestionText(question.getQuestionText());
                row.setPoints(question.getPoints());
                row.setAnswerText(item.getAnswerText());
                rows.add(row);
            } else if ("multiple_choice".equals(type)) {
                List<Long> picked = item.getSelectedOptionIds() == null
                        ? new ArrayList<>() : item.getSelectedOptionIds();
                if (new HashSet<>(picked).size() != picked.size()) {
                    throw new RuntimeException("The same option cannot be selected more than once");
                }
                for (Long optionId : picked) {
                    QuestionOption option = findOption(question, optionId);
                    AttemptAnswer row = new AttemptAnswer();
                    row.setAttempt(attempt);
                    row.setQuestion(question);
                    row.setQuestionText(question.getQuestionText());
                    row.setPoints(question.getPoints());
                    row.setSelectedOption(option);
                    row.setSelectedOptionText(option.getOptionText());
                    rows.add(row);
                }
            } else {
                AttemptAnswer row = new AttemptAnswer();
                row.setAttempt(attempt);
                row.setQuestion(question);
                row.setQuestionText(question.getQuestionText());
                row.setPoints(question.getPoints());
                if (item.getSelectedOptionId() != null) {
                    QuestionOption option = findOption(question, item.getSelectedOptionId());
                    row.setSelectedOption(option);
                    row.setSelectedOptionText(option.getOptionText());
                }
                rows.add(row);
            }
        }

        reconcile(attemptId, rows);
        return toResponse(attempt);
    }

    // POST /api/attempts/{attemptId}/submit
    @Transactional
    public AttemptResponse submit(Long attemptId, AttemptSubmitRequest request) {        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found: " + attemptId));
        User me = getCurrentUser();

        boolean admin = hasRole("ROLE_ADMIN");
        if (!attempt.getLearner().getId().equals(me.getId()) && !admin) {
            throw new RuntimeException("You can only submit your own attempt");
        }
        if (!"in_progress".equals(attempt.getStatus())) {
            throw new RuntimeException("Attempt already submitted — submitted responses cannot be edited");
        }

        Assessment assessment = attempt.getAssessment();
        requireWithinTime(attempt);

        BigDecimal totalScore = BigDecimal.ZERO;
        BigDecimal totalMax = assessment.getMaxScore();
        boolean hasShortAnswer = false;
        List<AttemptAnswer> rows = new ArrayList<>();
        Set<Long> answeredQuestions = new HashSet<>();

        for (AttemptSubmitRequest.AnswerItem item : request.getAnswers()) {
            if (!answeredQuestions.add(item.getQuestionId())) {
                throw new RuntimeException("Question " + item.getQuestionId() + " was answered more than once");
            }
            Question question = questionRepository.findById(item.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found: " + item.getQuestionId()));
            if (!question.getAssessment().getId().equals(assessment.getId())) {
                throw new RuntimeException("Question " + question.getId() + " does not belong to this assessment");
            }
            String type = question.getQuestionType();

            if ("short_answer".equals(type)) {
                hasShortAnswer = true;
                AttemptAnswer row = new AttemptAnswer();
                row.setAttempt(attempt);
                row.setQuestion(question);
                row.setQuestionText(question.getQuestionText());
                row.setPoints(question.getPoints());
                row.setAnswerText(item.getAnswerText());
                row.setIsCorrect(null);
                row.setPointsAwarded(BigDecimal.ZERO);
                rows.add(row);
            } else if ("multiple_choice".equals(type)) {
                List<Long> picked = item.getSelectedOptionIds() == null
                        ? new ArrayList<>() : item.getSelectedOptionIds();
                if (new HashSet<>(picked).size() != picked.size()) {
                    throw new RuntimeException("The same option cannot be selected more than once");
                }
                boolean exact = ScoringUtil.isExactMatch(question, picked);
                BigDecimal share = BigDecimal.ZERO;
                if (exact && !picked.isEmpty()) {
                    share = question.getPoints().divide(
                            new BigDecimal(picked.size()), 2, RoundingMode.HALF_UP);
                }
                for (Long optionId : picked) {
                    QuestionOption option = findOption(question, optionId);
                    AttemptAnswer row = new AttemptAnswer();
                    row.setAttempt(attempt);
                    row.setQuestion(question);
                    row.setQuestionText(question.getQuestionText());
                    row.setPoints(question.getPoints());
                    row.setSelectedOption(option);
                    row.setSelectedOptionText(option.getOptionText());
                    row.setIsCorrect(option.getIsCorrect());
                    if (exact && Boolean.TRUE.equals(option.getIsCorrect())) {
                        row.setPointsAwarded(share);
                        totalScore = totalScore.add(share);
                    } else {
                        row.setPointsAwarded(BigDecimal.ZERO);
                    }
                    rows.add(row);
                }
            } else {
                QuestionOption option = null;
                BigDecimal earned = BigDecimal.ZERO;
                Boolean correct = false;
                if (item.getSelectedOptionId() != null) {
                    option = findOption(question, item.getSelectedOptionId());
                    correct = option.getIsCorrect();
                    earned = ScoringUtil.scoreSingle(question, item.getSelectedOptionId());
                }
                AttemptAnswer row = new AttemptAnswer();
                row.setAttempt(attempt);
                row.setQuestion(question);
                row.setQuestionText(question.getQuestionText());
                row.setPoints(question.getPoints());
                row.setSelectedOption(option);
                row.setSelectedOptionText(option == null ? null : option.getOptionText());
                row.setIsCorrect(correct);
                row.setPointsAwarded(earned);
                totalScore = totalScore.add(earned);
                rows.add(row);
            }
        }

        reconcile(attemptId, rows);

        attempt.setScore(totalScore);
        attempt.setMaxScore(totalMax);
        attempt.setSubmittedAt(LocalDateTime.now());
        if (hasShortAnswer) {
            attempt.setStatus("pending_grading");
        } else {
            attempt.setStatus("graded");
            attempt.setPercentage(ScoringUtil.percentage(totalScore, totalMax));
            attempt.setPassed(ScoringUtil.isPassed(attempt.getPercentage(), assessment.getPassingScore()));
        }
        AssessmentAttempt saved = attemptRepository.save(attempt);

        notificationService.create(assessment.getCreatedBy(), "SUBMISSION",
                "New submission: " + assessment.getTitle(),
                me.getFirstName() + " " + me.getLastName() + " submitted attempt " + saved.getAttemptNumber());

        activityService.record(me, "ATTEMPT_SUBMITTED", "attempt", saved.getId());

        if ("graded".equals(saved.getStatus())) {
            progressService.refreshEnrollmentStatus(assessment.getCourse().getId(), me.getId());
        }

        return toResponse(saved);
    }

    // Update-in-place: match fresh rows to stored rows by answer key.
    // A stored row that matches is updated, a genuinely new one is inserted,
    // and a stored row nobody submitted anymore (unchecked option) is removed.
    // Deleted and inserted keys are always disjoint, so the unique constraint
    // can never fire regardless of flush order.
    private void reconcile(Long attemptId, List<AttemptAnswer> fresh) {
        List<AttemptAnswer> existing = answerRepository.findByAttemptId(attemptId);
        java.util.Map<String, AttemptAnswer> byKey = new java.util.LinkedHashMap<>();
        for (AttemptAnswer row : existing) {
            byKey.put(keyOf(row), row);
        }
        java.util.Set<String> seen = new java.util.HashSet<>();
        List<AttemptAnswer> toInsert = new ArrayList<>();
        for (AttemptAnswer row : fresh) {
            String key = keyOf(row);
            seen.add(key);
            AttemptAnswer kept = byKey.get(key);
            if (kept == null) {
                toInsert.add(row);
            } else {
                kept.setQuestionText(row.getQuestionText());
                kept.setPoints(row.getPoints());
                kept.setSelectedOption(row.getSelectedOption());
                kept.setSelectedOptionText(row.getSelectedOptionText());
                kept.setAnswerText(row.getAnswerText());
                kept.setIsCorrect(row.getIsCorrect());
                kept.setPointsAwarded(row.getPointsAwarded());
            }
        }
        List<AttemptAnswer> toDelete = new ArrayList<>();
        for (java.util.Map.Entry<String, AttemptAnswer> entry : byKey.entrySet()) {
            if (!seen.contains(entry.getKey())) {
                toDelete.add(entry.getValue());
            }
        }
        answerRepository.deleteAll(toDelete);
        answerRepository.saveAll(toInsert);
    }

    private String keyOf(AttemptAnswer row) {
        if (row.getSelectedOption() != null && row.getSelectedOption().getId() != null) {
            return row.getQuestion().getId() + "O" + row.getSelectedOption().getId();
        }
        return row.getQuestion().getId() + "T";
    }

    private QuestionOption findOption(Question question, Long optionId) {
        for (QuestionOption option : question.getOptions()) {
            if (option.getId().equals(optionId)) {
                return option;
            }
        }
        throw new RuntimeException("Option " + optionId + " does not belong to question " + question.getId());
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

    private boolean isExpired(AssessmentAttempt attempt) {
        Integer limit = attempt.getAssessment().getTimeLimitMinutes();
        if (limit == null) {
            return false;
        }
        LocalDateTime deadline = attempt.getStartedAt().plusMinutes(limit);
        return !deadline.isAfter(LocalDateTime.now());
    }

    private void requireWithinTime(AssessmentAttempt attempt) {
        if (isExpired(attempt)) {
            throw new RuntimeException("Time expired for this attempt — start a new attempt");
        }
    }

    private AttemptResponse toResponse(AssessmentAttempt a) {
        String status = "in_progress".equals(a.getStatus()) && isExpired(a)
                ? "expired" : a.getStatus();
        return new AttemptResponse(
                a.getId(),
                a.getAssessment().getId(),
                a.getLearner().getId(),
                a.getAttemptNumber(),
                status,
                a.getScore(),
                a.getMaxScore(),
                a.getPercentage(),
                a.getPassed(),
                a.getStartedAt(),
                a.getSubmittedAt()
        );
    }

    private AttemptAnswerResponse toAnswerResponse(AttemptAnswer a) {
        Long selectedOptionId = a.getSelectedOption() == null ? null : a.getSelectedOption().getId();
        return new AttemptAnswerResponse(
                a.getId(),
                a.getAttempt().getId(),
                a.getAttempt().getAttemptNumber(),
                a.getQuestion().getId(),
                a.getQuestionText(),
                a.getAnswerText(),
                selectedOptionId,
                a.getSelectedOptionText(),
                a.getPoints(),
                a.getPointsAwarded(),
                a.getFeedback()
        );
    }
}
