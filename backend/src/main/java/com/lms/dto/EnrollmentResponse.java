package com.lms.dto;

import java.time.LocalDateTime;

public class EnrollmentResponse {
    private final Long id;
    private final Long courseId;
    private final Long learnerId;
    private final String learnerName;
    private final String status;
    private final LocalDateTime dueDate;
    private final LocalDateTime enrolledAt;

    public EnrollmentResponse(Long id, Long courseId, Long learnerId, String learnerName,
                              String status, LocalDateTime dueDate, LocalDateTime enrolledAt) {
        this.id = id;
        this.courseId = courseId;
        this.learnerId = learnerId;
        this.learnerName = learnerName;
        this.status = status;
        this.dueDate = dueDate;
        this.enrolledAt = enrolledAt;
    }

    public Long getId() { return id; }
    public Long getCourseId() { return courseId; }
    public Long getLearnerId() { return learnerId; }
    public String getLearnerName() { return learnerName; }
    public String getStatus() { return status; }
    public LocalDateTime getDueDate() { return dueDate; }
    public LocalDateTime getEnrolledAt() { return enrolledAt; }
    
}