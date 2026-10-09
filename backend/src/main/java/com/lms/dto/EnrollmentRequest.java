package com.lms.dto;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class EnrollmentRequest {

    @NotNull(message = "learnerId must not be blank")
    private Long learnerId;

    private LocalDateTime dueDate;

    public EnrollmentRequest() {}

    public Long getLearnerId() { return learnerId; }
    public void setLearnerId(Long learnerId) { this.learnerId = learnerId; }
    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
}
