package com.lms.dto;

import java.time.LocalDateTime;

public class LessonCompletionResponse {
    private final Long lessonId;
    private final Long learnerId;
    private final LocalDateTime completedAt;

    public LessonCompletionResponse(Long lessonId, Long learnerId, LocalDateTime completedAt) {
        this.lessonId = lessonId;
        this.learnerId = learnerId;
        this.completedAt = completedAt;
    }

    public Long getLessonId() { return lessonId; }
    public Long getLearnerId() { return learnerId; }
    public LocalDateTime getCompletedAt() { return completedAt; }
}
