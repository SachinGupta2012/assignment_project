package com.lms.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AttemptResponse {
    private final Long id;
    private final Long assessmentId;
    private final Long learnerId;
    private final Integer attemptNumber;
    private final String status;
    private final BigDecimal score;
    private final BigDecimal maxScore;
    private final BigDecimal percentage;
    private final Boolean passed;
    private final LocalDateTime startedAt;
    private final LocalDateTime submittedAt;

    public AttemptResponse(Long id, Long assessmentId, Long learnerId, Integer attemptNumber,
                           String status, BigDecimal score, BigDecimal maxScore, BigDecimal percentage,
                           Boolean passed, LocalDateTime startedAt, LocalDateTime submittedAt) {
        this.id = id;
        this.assessmentId = assessmentId;
        this.learnerId = learnerId;
        this.attemptNumber = attemptNumber;
        this.status = status;
        this.score = score;
        this.maxScore = maxScore;
        this.percentage = percentage;
        this.passed = passed;
        this.startedAt = startedAt;
        this.submittedAt = submittedAt;
    }

    public Long getId() { return id; }
    public Long getAssessmentId() { return assessmentId; }
    public Long getLearnerId() { return learnerId; }
    public Integer getAttemptNumber() { return attemptNumber; }
    public String getStatus() { return status; }
    public BigDecimal getScore() { return score; }
    public BigDecimal getMaxScore() { return maxScore; }
    public BigDecimal getPercentage() { return percentage; }
    public Boolean getPassed() { return passed; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
}
