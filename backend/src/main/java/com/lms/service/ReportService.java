package com.lms.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dto.CourseReportResponse;
import com.lms.entity.Assessment;
import com.lms.entity.AssessmentAttempt;
import com.lms.entity.Enrollment;
import com.lms.repository.AssessmentAttemptRepository;
import com.lms.repository.AssessmentRepository;
import com.lms.repository.CourseRepository;
import com.lms.repository.EnrollmentRepository;

@Service
public class ReportService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AssessmentRepository assessmentRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final ProgressService progressService;

    public ReportService(CourseRepository courseRepository,
                         EnrollmentRepository enrollmentRepository,
                         AssessmentRepository assessmentRepository,
                         AssessmentAttemptRepository attemptRepository,
                         ProgressService progressService) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.assessmentRepository = assessmentRepository;
        this.attemptRepository = attemptRepository;
        this.progressService = progressService;
    }

    // GET /api/reports/courses/{courseId}/summary
    @Transactional(readOnly = true)
    public CourseReportResponse courseSummary(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Course not found: " + courseId);
        }
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);

        long approved = 0;
        long pending = 0;
        long completed = 0;
        long overdue = 0;
        LocalDateTime now = LocalDateTime.now();
        for (Enrollment enrollment : enrollments) {
            if ("completed".equals(enrollment.getStatus())) {
                completed++;
            } else if ("approved".equals(enrollment.getStatus())) {
                approved++;
                int percentage = progressService.getProgress(
                        courseId, enrollment.getUser().getId()).getPercentage();
                if (percentage == 100) {
                    completed++;
                }
                if (enrollment.getDueDate() != null && enrollment.getDueDate().isBefore(now)
                        && percentage < 100) {
                    overdue++;
                }
            } else if ("pending".equals(enrollment.getStatus())) {
                pending++;
            }
        }

        BigDecimal scoreSum = BigDecimal.ZERO;
        long gradedCount = 0;
        long passedCount = 0;
        List<Assessment> assessments = assessmentRepository.findByCourseIdOrderByDisplayOrder(courseId);
        for (Assessment assessment : assessments) {
            List<AssessmentAttempt> attempts = attemptRepository.findByAssessmentId(assessment.getId());
            for (AssessmentAttempt attempt : attempts) {
                if ("graded".equals(attempt.getStatus()) && attempt.getPercentage() != null) {
                    gradedCount++;
                    scoreSum = scoreSum.add(attempt.getPercentage());
                    if (Boolean.TRUE.equals(attempt.getPassed())) {
                        passedCount++;
                    }
                }
            }
        }
        BigDecimal avgScore = BigDecimal.ZERO;
        BigDecimal passRate = BigDecimal.ZERO;
        if (gradedCount > 0) {
            avgScore = scoreSum.divide(new BigDecimal(gradedCount), 2, RoundingMode.HALF_UP);
            passRate = new BigDecimal(passedCount).multiply(new BigDecimal("100"))
                    .divide(new BigDecimal(gradedCount), 2, RoundingMode.HALF_UP);
        }

        return new CourseReportResponse(courseId, enrollments.size(), approved, pending,
                completed, overdue, avgScore, passRate);
    }

    // GET /api/reports/enrollments/export?courseId=&status=&instructorId=&learnerId=&from=&to=
    @Transactional(readOnly = true)
    public String exportEnrollments(Long courseId, String status, Long instructorId,
                                    Long learnerId, LocalDateTime from, LocalDateTime to) {
        List<Enrollment> enrollments;
        if (courseId != null && status != null) {
            enrollments = enrollmentRepository.findByCourseIdAndStatus(courseId, status);
        } else if (courseId != null) {
            enrollments = enrollmentRepository.findByCourseId(courseId);
        } else {
            enrollments = enrollmentRepository.findAll();
        }
        StringBuilder csv = new StringBuilder("id,course_id,learner_name,learner_email,status,due_date,enrolled_at\n");
        for (Enrollment enrollment : enrollments) {
            if (instructorId != null
                    && !instructorId.equals(enrollment.getCourse().getInstructor().getId())) {
                continue;
            }
            if (learnerId != null && !learnerId.equals(enrollment.getUser().getId())) {
                continue;
            }
            if (from != null && enrollment.getEnrolledAt().isBefore(from)) {
                continue;
            }
            if (to != null && enrollment.getEnrolledAt().isAfter(to)) {
                continue;
            }
            csv.append(enrollment.getId()).append(",");
            csv.append(enrollment.getCourse().getId()).append(",");
            csv.append(csvText(enrollment.getUser().getFirstName() + " " + enrollment.getUser().getLastName())).append(",");
            csv.append(csvText(enrollment.getUser().getEmail())).append(",");
            csv.append(enrollment.getStatus()).append(",");
            csv.append(enrollment.getDueDate() == null ? "" : enrollment.getDueDate()).append(",");
            csv.append(enrollment.getEnrolledAt()).append("\n");
        }
        return csv.toString();
    }

    // GET /api/reports/results/export?courseId=&learnerId=&status=&from=&to=
    @Transactional(readOnly = true)
    public String exportResults(Long courseId, Long learnerId, String status,
                                LocalDateTime from, LocalDateTime to) {
        StringBuilder csv = new StringBuilder(
                "attempt_id,assessment,learner_email,attempt_number,status,score,max_score,percentage,passed\n");
        List<Assessment> assessments = assessmentRepository.findByCourseIdOrderByDisplayOrder(courseId);
        for (Assessment assessment : assessments) {
            List<AssessmentAttempt> attempts = attemptRepository.findByAssessmentId(assessment.getId());
            for (AssessmentAttempt attempt : attempts) {
                if (learnerId != null && !learnerId.equals(attempt.getLearner().getId())) {
                    continue;
                }
                if (status != null && !status.equals(attempt.getStatus())) {
                    continue;
                }
                if (from != null && attempt.getCreatedAt().isBefore(from)) {
                    continue;
                }
                if (to != null && attempt.getCreatedAt().isAfter(to)) {
                    continue;
                }
                csv.append(attempt.getId()).append(",");
                csv.append(csvText(assessment.getTitle())).append(",");
                csv.append(csvText(attempt.getLearner().getEmail())).append(",");
                csv.append(attempt.getAttemptNumber()).append(",");
                csv.append(attempt.getStatus()).append(",");
                csv.append(attempt.getScore()).append(",");
                csv.append(attempt.getMaxScore()).append(",");
                csv.append(attempt.getPercentage() == null ? "" : attempt.getPercentage()).append(",");
                csv.append(attempt.getPassed() == null ? "" : attempt.getPassed()).append("\n");
            }
        }
        return csv.toString();
    }

    private String csvText(String value) {
        if (value == null) {
            return "";
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
