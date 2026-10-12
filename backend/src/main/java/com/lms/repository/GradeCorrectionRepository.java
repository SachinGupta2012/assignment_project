package com.lms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lms.entity.GradeCorrection;

@Repository
public interface GradeCorrectionRepository extends JpaRepository<GradeCorrection, Long> {
    List<GradeCorrection> findByAnswerIdOrderByCreatedAtDesc(Long answerId);
}
