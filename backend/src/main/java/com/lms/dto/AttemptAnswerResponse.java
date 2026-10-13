package com.lms.dto;

import java.math.BigDecimal;

public class AttemptAnswerResponse {
    private final Long id;
    private final Long attemptId;
    private final Long questionId;
    private final String questionText;
    private final String answerText;
    private final String selectedOptionText;
    private final BigDecimal points;
    private final BigDecimal pointsAwarded;
    private final String feedback;

    public AttemptAnswerResponse(Long id, Long attemptId, Long questionId, String questionText,
                                 String answerText, String selectedOptionText, BigDecimal points,
                                 BigDecimal pointsAwarded, String feedback) {
        this.id = id;
        this.attemptId = attemptId;
        this.questionId = questionId;
        this.questionText = questionText;
        this.answerText = answerText;
        this.selectedOptionText = selectedOptionText;
        this.points = points;
        this.pointsAwarded = pointsAwarded;
        this.feedback = feedback;
    }

    public Long getId() { return id; }
    public Long getAttemptId() { return attemptId; }
    public Long getQuestionId() { return questionId; }
    public String getQuestionText() { return questionText; }
    public String getAnswerText() { return answerText; }
    public String getSelectedOptionText() { return selectedOptionText; }
    public BigDecimal getPoints() { return points; }
    public BigDecimal getPointsAwarded() { return pointsAwarded; }
    public String getFeedback() { return feedback; }
}
