package com.lms.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public class AttemptSubmitRequest {

    @NotEmpty(message = "answers must not be empty")
    private List<AnswerItem> answers;

    public static class AnswerItem {
        @NotNull(message = "questionId must not be blank")
        private Long questionId;
        private Long selectedOptionId;
        private List<Long> selectedOptionIds;
        private String answerText;

        public AnswerItem() {}
        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }
        public Long getSelectedOptionId() { return selectedOptionId; }
        public void setSelectedOptionId(Long selectedOptionId) { this.selectedOptionId = selectedOptionId; }
        public List<Long> getSelectedOptionIds() { return selectedOptionIds; }
        public void setSelectedOptionIds(List<Long> selectedOptionIds) { this.selectedOptionIds = selectedOptionIds; }
        public String getAnswerText() { return answerText; }
        public void setAnswerText(String answerText) { this.answerText = answerText; }
    }

    public AttemptSubmitRequest() {}

    public List<AnswerItem> getAnswers() { return answers; }
    public void setAnswers(List<AnswerItem> answers) { this.answers = answers; }
}
