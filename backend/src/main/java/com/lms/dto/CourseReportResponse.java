package com.lms.dto;

import java.math.BigDecimal;

public class CourseReportResponse {
    private final Long courseId;
    private final long enrolledTotal;
    private final long approved;
    private final long pending;
    private final long completed;
    private final long overdue;
    private final BigDecimal avgScore;
    private final BigDecimal passRate;

    public CourseReportResponse(Long courseId, long enrolledTotal, long approved, long pending,
                                long completed, long overdue, BigDecimal avgScore, BigDecimal passRate) {
        this.courseId = courseId;
        this.enrolledTotal = enrolledTotal;
        this.approved = approved;
        this.pending = pending;
        this.completed = completed;
        this.overdue = overdue;
        this.avgScore = avgScore;
        this.passRate = passRate;
    }

    public Long getCourseId() { return courseId; }
    public long getEnrolledTotal() { return enrolledTotal; }
    public long getApproved() { return approved; }
    public long getPending() { return pending; }
    public long getCompleted() { return completed; }
    public long getOverdue() { return overdue; }
    public BigDecimal getAvgScore() { return avgScore; }
    public BigDecimal getPassRate() { return passRate; }
}
