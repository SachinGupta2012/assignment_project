package com.lms;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dto.AssessmentRequest;
import com.lms.dto.AttemptSubmitRequest;
import com.lms.dto.CourseRequest;
import com.lms.dto.EnrollmentRequest;
import com.lms.dto.QuestionRequest;
import com.lms.entity.User;
import com.lms.repository.UserRepository;
import com.lms.service.AssessmentService;
import com.lms.service.AttemptService;
import com.lms.service.CourseService;
import com.lms.service.EnrollmentService;
import com.lms.service.GradingService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
public class GradingServiceTest {

    @Autowired
    private GradingService gradingService;

    @Autowired
    private AttemptService attemptService;

    @Autowired
    private AssessmentService assessmentService;

    @Autowired
    private EnrollmentService enrollmentService;

    @Autowired
    private CourseService courseService;

    @Autowired
    private UserRepository userRepository;

    private void loginAs(String email, String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null,
                        List.of(new SimpleGrantedAuthority(role))));
    }

    private Long userId(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return user.getId();
    }

    @Test
    public void shortAnswerGradedThroughQueue() {
        loginAs("vikram.singh@lms.com", "ROLE_INSTRUCTOR");
        CourseRequest courseRequest = new CourseRequest();
        courseRequest.setTitle("Grade Course");
        courseRequest.setDescription("d");
        courseRequest.setInstructorId(userId("vikram.singh@lms.com"));
        courseRequest.setEstimateDuration(10);
        courseRequest.setLevel("beginner");
        courseRequest.setEnrollmentMode("open");
        Long courseId = courseService.create(courseRequest).getId();

        AssessmentRequest quizRequest = new AssessmentRequest();
        quizRequest.setCourseId(courseId);
        quizRequest.setTitle("Q Short");
        quizRequest.setPassingScore(60);
        quizRequest.setMaxAttempts(3);
        Long quizId = assessmentService.create(courseId, quizRequest).getId();

        QuestionRequest questionRequest = new QuestionRequest();
        questionRequest.setQuestionText("Capital of France?");
        questionRequest.setQuestionType("short_answer");
        questionRequest.setPoints(new BigDecimal("5"));
        questionRequest.setCorrectAnswer("Paris");
        Long questionId = assessmentService.addQuestion(quizId, questionRequest).getId();

        loginAs("priya.sharma@lms.com", "ROLE_TRAINING_MANAGER");
        EnrollmentRequest enrollRequest = new EnrollmentRequest();
        enrollRequest.setLearnerId(userId("ananya.iyer@lms.com"));
        Long enrollmentId = enrollmentService.enroll(courseId, enrollRequest).getId();
        enrollmentService.updateStatus(enrollmentId, "approved");

        loginAs("ananya.iyer@lms.com", "ROLE_LEARNER");
        Long attemptId = attemptService.start(quizId).getId();

        AttemptSubmitRequest submit = new AttemptSubmitRequest();
        AttemptSubmitRequest.AnswerItem item = new AttemptSubmitRequest.AnswerItem();
        item.setQuestionId(questionId);
        item.setAnswerText("Paris");
        submit.setAnswers(List.of(item));

        var pending = attemptService.submit(attemptId, submit);
        assertEquals("pending_grading", pending.getStatus());

        loginAs("vikram.singh@lms.com", "ROLE_INSTRUCTOR");
        var queue = gradingService.queue();
        assertFalse(queue.isEmpty());
        Long answerId = queue.get(0).getId();

        var graded = gradingService.gradeAnswer(answerId, new BigDecimal("5"), "Correct", null);
        assertEquals(new BigDecimal("5"), graded.getPointsAwarded());

        assertThrows(RuntimeException.class,
                () -> gradingService.gradeAnswer(answerId, new BigDecimal("4"), null, null));

        var corrected = gradingService.gradeAnswer(answerId, new BigDecimal("4"), null, "Partial credit");
        assertEquals(new BigDecimal("4"), corrected.getPointsAwarded());
    }
}
