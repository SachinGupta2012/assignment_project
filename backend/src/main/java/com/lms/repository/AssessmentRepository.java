package com.lms.repository;

import com.lms.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findByCourseIdOrderByDisplayOrder(Long courseId);
    List<Assessment> findByModuleIdOrderByDisplayOrder(Long moduleId);
    Page<Assessment> findByCourseId(Long courseId, Pageable pageable);
}
