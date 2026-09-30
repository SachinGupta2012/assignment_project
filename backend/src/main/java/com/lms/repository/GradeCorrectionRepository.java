package com.lms.repository;

import com.lms.entity.GradeCorrection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GradeCorrectionRepository extends JpaRepository<GradeCorrection, Long> {
    List<GradeCorrection> findByGradeId(Long gradeId);
}
