package com.lms.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "grade_corrections")
public class GradeCorrection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grade_id", nullable = false)
    private Grade grade;

    @Column(name = "previous_score", nullable = false)
    private BigDecimal previousScore;

    @Column(name = "new_score", nullable = false)
    private BigDecimal newScore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "corrected_by", nullable = false)
    private User correctedBy;

    @Column(nullable = false)
    private String reason;

    @Column(name = "corrected_at", nullable = false)
    private LocalDateTime correctedAt = LocalDateTime.now();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public GradeCorrection() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Grade getGrade() { return grade; }
    public void setGrade(Grade grade) { this.grade = grade; }

    public BigDecimal getPreviousScore() { return previousScore; }
    public void setPreviousScore(BigDecimal previousScore) { this.previousScore = previousScore; }

    public BigDecimal getNewScore() { return newScore; }
    public void setNewScore(BigDecimal newScore) { this.newScore = newScore; }

    public User getCorrectedBy() { return correctedBy; }
    public void setCorrectedBy(User correctedBy) { this.correctedBy = correctedBy; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDateTime getCorrectedAt() { return correctedAt; }
    public void setCorrectedAt(LocalDateTime correctedAt) { this.correctedAt = correctedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
