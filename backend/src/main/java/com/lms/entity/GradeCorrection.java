package com.lms.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "grade_corrections")
public class GradeCorrection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id", nullable = false)
    private AttemptAnswer answer;

    @Column(name = "old_points", nullable = false)
    private BigDecimal oldPoints;

    @Column(name = "new_points", nullable = false)
    private BigDecimal newPoints;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "editor_id", nullable = false)
    private User editor;

    @Column(nullable = false)
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public GradeCorrection() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public AttemptAnswer getAnswer() { return answer; }
    public void setAnswer(AttemptAnswer answer) { this.answer = answer; }
    public BigDecimal getOldPoints() { return oldPoints; }
    public void setOldPoints(BigDecimal oldPoints) { this.oldPoints = oldPoints; }
    public BigDecimal getNewPoints() { return newPoints; }
    public void setNewPoints(BigDecimal newPoints) { this.newPoints = newPoints; }
    public User getEditor() { return editor; }
    public void setEditor(User editor) { this.editor = editor; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
