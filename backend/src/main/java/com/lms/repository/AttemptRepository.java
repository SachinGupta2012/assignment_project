package com.lms.repository;

import com.lms.entity.Attempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttemptRepository extends JpaRepository<Attempt, Long> {
    long countByAssessmentIdAndUserId(Long assessmentId, Long userId);
    Optional<Attempt> findFirstByUserIdAndAssessmentIdOrderByAttemptNumberDesc(Long userId, Long assessmentId);
    List<Attempt> findByUserId(Long userId);
    List<Attempt> findByAssessmentId(Long assessmentId);
    Optional<Attempt> findByIdAndUserId(Long id, Long userId);
}
