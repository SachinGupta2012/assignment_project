package com.lms.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AssessmentRequest {

    private Long moduleId;

    @NotBlank(message = "title must not be blank")
    @Size(max = 500, message = "title must be at most 500 characters")
    private String title;

    private String description;
    @NotNull(message = "passingScore must not be blank")
    @Min(value = 0, message = "passingScore must be at least 0")
    @Max(value = 100, message = "passingScore must be at most 100")
    private Integer passingScore = 60;

    @Min(value = 1, message = "timeLimitMinutes must be at least 1")
    private Integer timeLimitMinutes;

    @NotNull(message = "maxAttempts must not be blank")
    @Min(value = 1, message = "maxAttempts must be at least 1")
    private Integer maxAttempts = 3;
    private Integer displayOrder;

    public AssessmentRequest() {}

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getPassingScore() { return passingScore; }
    public void setPassingScore(Integer passingScore) { this.passingScore = passingScore; }
    public Integer getTimeLimitMinutes() { return timeLimitMinutes; }
    public void setTimeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; }
    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
}
