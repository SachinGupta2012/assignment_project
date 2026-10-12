package com.lms.dto;

import java.math.BigDecimal;
import java.util.List;

public class QuestionResponse {
    private final Long id;
    private final String questionText;
    private final String questionType;
    private final BigDecimal points;
    private final Integer displayOrder;
    private final List<OptionResponse> options;

    public static class OptionResponse {
        private final Long id;
        private final String optionText;
        private final Integer displayOrder;

        public OptionResponse(Long id, String optionText, Integer displayOrder) {
            this.id = id;
            this.optionText = optionText;
            this.displayOrder = displayOrder;
        }

        public Long getId() { return id; }
        public String getOptionText() { return optionText; }
        public Integer getDisplayOrder() { return displayOrder; }
    }

    public QuestionResponse(Long id, String questionText, String questionType,
                            BigDecimal points, Integer displayOrder, List<OptionResponse> options) {
        this.id = id;
        this.questionText = questionText;
        this.questionType = questionType;
        this.points = points;
        this.displayOrder = displayOrder;
        this.options = options;
    }

    public Long getId() { return id; }
    public String getQuestionText() { return questionText; }
    public String getQuestionType() { return questionType; }
    public BigDecimal getPoints() { return points; }
    public Integer getDisplayOrder() { return displayOrder; }
    public List<OptionResponse> getOptions() { return options; }
}
