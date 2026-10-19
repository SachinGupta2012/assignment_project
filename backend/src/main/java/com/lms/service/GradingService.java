package com.lms.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dto.AttemptAnswerResponse;
import com.lms.entity.AssessmentAttempt;
import com.lms.entity.AttemptAnswer;
import com.lms.entity.GradeCorrection;
import com.lms.entity.User;
import com.lms.repository.AssessmentAttemptRepository;
import com.lms.repository.AttemptAnswerRepository;
import com.lms.repository.GradeCorrectionRepository;
import com.lms.repository.UserRepository;

@Service
public class GradingService {

    private final AttemptAnswerRepository answerRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final GradeCorrectionRepository correctionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ActivityService activityService;
    private final ProgressService progressService;

    public GradingService(AttemptAnswerRepository answerRepository,
                          AssessmentAttemptRepository attemptRepository,
                          GradeCorrectionRepository correctionRepository,
                          UserRepository userRepository,
                          NotificationService notificationService,
                          ActivityService activityService,
                          ProgressService progressService) {
        this.answerRepository = answerRepository;
        this.attemptRepository = attemptRepository;
        this.correctionRepository = correctionRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.activityService = activityService;
        this.progressService = progressService;
    }

    // GET /api/grading/queue
    @Transactional(readOnly = true)
    public List<AttemptAnswerResponse> queue() {
        User me = getCurrentUser();
        List<AttemptAnswerResponse> out = new ArrayList<>();
        List<AttemptAnswer> pending = answerRepository.findPendingShortAnswers(me.getId());
        for (AttemptAnswer answer : pending) {
            out.add(toResponse(answer));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public List<AttemptAnswerResponse> graded() {
        User me = getCurrentUser();
        List<AttemptAnswerResponse> out = new ArrayList<>();
        List<AttemptAnswer> graded = answerRepository.findGradedShortAnswers(me.getId());
        for (AttemptAnswer answer : graded) {
            out.add(toResponse(answer));
        }
        return out;
    }

    // PATCH /api/grading/answers/{answerId}?points=&feedback=&reason=
    @Transactional
    public AttemptAnswerResponse gradeAnswer(Long answerId, BigDecimal points, String feedback, String reason) {
        requireStaff();
        User me = getCurrentUser();

        AttemptAnswer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new RuntimeException("Answer not found: " + answerId));
        if (!hasRole("ROLE_ADMIN")
                && !answer.getAttempt().getAssessment().getCreatedBy().getId().equals(me.getId())) {
            throw new RuntimeException("You can only grade answers from your own assessments");
        }

        if (points.compareTo(BigDecimal.ZERO) < 0 || points.compareTo(answer.getPoints()) > 0) {
            throw new RuntimeException("Points must be between 0 and " + answer.getPoints());
        }

        boolean gradeChanged = answer.getGradedBy() != null
                && answer.getPointsAwarded().compareTo(points) != 0;
        boolean wasAttemptGraded = "graded".equals(answer.getAttempt().getStatus());
        if (gradeChanged) {
            if (reason == null || reason.isBlank()) {
                throw new RuntimeException("A reason is required to change an existing grade");
            }
            GradeCorrection correction = new GradeCorrection();
            correction.setAnswer(answer);
            correction.setOldPoints(answer.getPointsAwarded());
            correction.setNewPoints(points);
            correction.setEditor(me);
            correction.setReason(reason);
            correctionRepository.save(correction);
        }

        answer.setPointsAwarded(points);
        answer.setFeedback(feedback);
        answer.setIsCorrect(points.compareTo(BigDecimal.ZERO) > 0);
        answer.setGradedBy(me);
        answerRepository.save(answer);

        AssessmentAttempt attempt = answer.getAttempt();
        recompute(attempt);
        if ("graded".equals(attempt.getStatus())) {
            progressService.refreshEnrollmentStatus(
                    attempt.getAssessment().getCourse().getId(),
                    attempt.getLearner().getId());
        }

        notificationService.create(attempt.getLearner(), "RESULT",
                "Result updated: " + attempt.getAssessment().getTitle(),
                "Your attempt " + attempt.getAttemptNumber() + " has been graded.");

        if (gradeChanged) {
            activityService.record(me, "GRADE_CHANGED", "attempt_answer", answer.getId());
        } else if (!wasAttemptGraded && "graded".equals(attempt.getStatus())) {
            activityService.record(me, "GRADE_PUBLISHED", "attempt", attempt.getId());
        } else {
            activityService.record(me, "GRADE_ASSIGNED", "attempt_answer", answer.getId());
        }

        return toResponse(answer);
    }

    private void recompute(AssessmentAttempt attempt) {
        List<AttemptAnswer> rows = answerRepository.findByAttemptId(attempt.getId());
        BigDecimal total = BigDecimal.ZERO;
        boolean allGraded = true;
        for (AttemptAnswer row : rows) {
            total = total.add(row.getPointsAwarded());
            if ("short_answer".equals(row.getQuestion().getQuestionType()) && row.getGradedBy() == null) {
                allGraded = false;
            }
        }
        attempt.setScore(total);
        if (allGraded && attempt.getSubmittedAt() != null) {
            attempt.setStatus("graded");
            attempt.setPercentage(ScoringUtil.percentage(total, attempt.getMaxScore()));
            attempt.setPassed(ScoringUtil.isPassed(
                    attempt.getPercentage(), attempt.getAssessment().getPassingScore()));
        }
        attemptRepository.save(attempt);
    }

    private void requireStaff() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        for (var authority : auth.getAuthorities()) {
            String role = authority.getAuthority();
            if ("ROLE_INSTRUCTOR".equals(role) || "ROLE_ADMIN".equals(role)) {
                return;
            }
        }
        throw new RuntimeException("Only instructors can grade answers");
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

    private AttemptAnswerResponse toResponse(AttemptAnswer a) {
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
