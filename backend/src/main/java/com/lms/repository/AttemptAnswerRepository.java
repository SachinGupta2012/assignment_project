package com.lms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lms.entity.AttemptAnswer;

@Repository
public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, Long> {
    List<AttemptAnswer> findByAttemptId(Long attemptId);

    @Query("select a from AttemptAnswer a where a.question.questionType = 'short_answer' "
         + "and a.gradedBy is null and a.attempt.assessment.createdBy.id = :instructorId "
         + "order by a.createdAt asc")
    List<AttemptAnswer> findPendingShortAnswers(@Param("instructorId") Long instructorId);

    @Query("select a from AttemptAnswer a where a.question.questionType = 'short_answer' "
         + "and a.gradedBy is not null and a.attempt.assessment.createdBy.id = :instructorId "
         + "order by a.updatedAt desc")
    List<AttemptAnswer> findGradedShortAnswers(@Param("instructorId") Long instructorId);
}
