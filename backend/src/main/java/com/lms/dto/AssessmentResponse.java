package com.lms.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AssessmentResponse {
    private final Long id;
    private final Long courseId;
    private final Long moduleId;
    private final String title;
    private final String description;
    private final BigDecimal passingScore;
    private final BigDecimal maxScore;
    private final Integer timeLimitMinutes;
    private final Integer maxAttempts;
    private final Boolean isRequired;
    private final Integer displayOrder;
    private final LocalDateTime createdAt;

    public AssessmentResponse(Long id, Long courseId, Long moduleId, String title, String description,
                              BigDecimal passingScore, BigDecimal maxScore, Integer timeLimitMinutes,
                              Integer maxAttempts, Boolean isRequired, Integer displayOrder,
                              LocalDateTime createdAt) {
        this.id = id;
        this.courseId = courseId;
        this.moduleId = moduleId;
        this.title = title;
        this.description = description;
        this.passingScore = passingScore;
        this.maxScore = maxScore;
        this.timeLimitMinutes = timeLimitMinutes;
        this.maxAttempts = maxAttempts;
        this.isRequired = isRequired;
        this.displayOrder = displayOrder;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getCourseId() { return courseId; }
    public Long getModuleId() { return moduleId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public BigDecimal getPassingScore() { return passingScore; }
    public BigDecimal getMaxScore() { return maxScore; }
    public Integer getTimeLimitMinutes() { return timeLimitMinutes; }
    public Integer getMaxAttempts() { return maxAttempts; }
    public Boolean getIsRequired() { return isRequired; }
    public Integer getDisplayOrder() { return displayOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
