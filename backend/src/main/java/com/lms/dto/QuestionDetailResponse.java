package com.lms.dto;

import java.math.BigDecimal;
import java.util.List;

public class QuestionDetailResponse {
    private final Long id;
    private final String questionText;
    private final String questionType;
    private final BigDecimal points;
    private final String correctAnswer;
    private final String explanation;
    private final Integer displayOrder;
    private final List<OptionDetail> options;

    public static class OptionDetail {
        private final Long id;
        private final String optionText;
        private final Boolean isCorrect;
        private final Integer displayOrder;

        public OptionDetail(Long id, String optionText, Boolean isCorrect, Integer displayOrder) {
            this.id = id;
            this.optionText = optionText;
            this.isCorrect = isCorrect;
            this.displayOrder = displayOrder;
        }

        public Long getId() { return id; }
        public String getOptionText() { return optionText; }
        public Boolean getIsCorrect() { return isCorrect; }
        public Integer getDisplayOrder() { return displayOrder; }
    }

    public QuestionDetailResponse(Long id, String questionText, String questionType, BigDecimal points,
                                  String correctAnswer, String explanation, Integer displayOrder,
                                  List<OptionDetail> options) {
        this.id = id;
        this.questionText = questionText;
        this.questionType = questionType;
        this.points = points;
        this.correctAnswer = correctAnswer;
        this.explanation = explanation;
        this.displayOrder = displayOrder;
        this.options = options;
    }

    public Long getId() { return id; }
    public String getQuestionText() { return questionText; }
    public String getQuestionType() { return questionType; }
    public BigDecimal getPoints() { return points; }
    public String getCorrectAnswer() { return correctAnswer; }
    public String getExplanation() { return explanation; }
    public Integer getDisplayOrder() { return displayOrder; }
    public List<OptionDetail> getOptions() { return options; }
}
