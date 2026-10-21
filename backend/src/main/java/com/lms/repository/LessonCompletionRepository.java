package com.lms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lms.entity.LessonCompletion;

@Repository
public interface LessonCompletionRepository extends JpaRepository<LessonCompletion, Long> {
    boolean existsByLessonIdAndLearnerId(Long lessonId, Long learnerId);
    boolean existsByLessonModuleId(Long moduleId);
    List<LessonCompletion> findByLessonModuleCourseIdAndLearnerIdOrderByCompletedAtAsc(Long courseId, Long learnerId);
}
