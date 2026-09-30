package com.lms.repository;

import com.lms.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findByCourseIdOrderByDisplayOrder(Long courseId);
    List<Assessment> findByModuleIdOrderByDisplayOrder(Long moduleId);
}
