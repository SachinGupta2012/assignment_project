package com.lms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lms.entity.AssessmentAttempt;

@Repository
public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, Long> {
    long countByAssessmentIdAndLearnerId(Long assessmentId, Long learnerId);
    List<AssessmentAttempt> findByAssessmentIdAndLearnerIdOrderByAttemptNumberAsc(Long assessmentId, Long learnerId);
    List<AssessmentAttempt> findByAssessmentId(Long assessmentId);
}
