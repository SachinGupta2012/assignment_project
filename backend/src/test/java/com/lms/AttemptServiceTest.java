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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
public class AttemptServiceTest {

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
    public void secondAttemptBeyondLimitFails() {
        loginAs("vikram.singh@lms.com", "ROLE_INSTRUCTOR");
        CourseRequest courseRequest = new CourseRequest();
        courseRequest.setTitle("Limit Course");
        courseRequest.setDescription("d");
        courseRequest.setInstructorId(userId("vikram.singh@lms.com"));
        courseRequest.setEstimateDuration(10);
        courseRequest.setLevel("beginner");
        courseRequest.setEnrollmentMode("open");
        Long courseId = courseService.create(courseRequest).getId();

        AssessmentRequest quizRequest = new AssessmentRequest();
        quizRequest.setTitle("Q1");
        quizRequest.setPassingScore(60);
        quizRequest.setMaxAttempts(1);
        Long quizId = assessmentService.create(courseId, quizRequest).getId();

        QuestionRequest questionRequest = new QuestionRequest();
        questionRequest.setQuestionText("2+2?");
        questionRequest.setQuestionType("single_choice");
        questionRequest.setPoints(new BigDecimal("10"));
        QuestionRequest.OptionItem correct = new QuestionRequest.OptionItem();
        correct.setOptionText("4");
        correct.setIsCorrect(true);
        QuestionRequest.OptionItem wrong = new QuestionRequest.OptionItem();
        wrong.setOptionText("5");
        wrong.setIsCorrect(false);
        questionRequest.setOptions(List.of(correct, wrong));
        var question = assessmentService.addQuestion(quizId, questionRequest);
        Long correctOptionId = null;
        for (var option : question.getOptions()) {
            if (Boolean.TRUE.equals(option.getIsCorrect())) {
                correctOptionId = option.getId();
            }
        }

        QuestionRequest secondQuestion = new QuestionRequest();
        secondQuestion.setQuestionText("3+3?");
        secondQuestion.setQuestionType("single_choice");
        secondQuestion.setPoints(new BigDecimal("10"));
        secondQuestion.setOptions(List.of(correct, wrong));
        assessmentService.addQuestion(quizId, secondQuestion);

        loginAs("priya.sharma@lms.com", "ROLE_TRAINING_MANAGER");
        EnrollmentRequest enrollRequest = new EnrollmentRequest();
        enrollRequest.setLearnerId(userId("ananya.iyer@lms.com"));
        Long enrollmentId = enrollmentService.enroll(courseId, enrollRequest).getId();
        enrollmentService.updateStatus(enrollmentId, "approved");

        loginAs("ananya.iyer@lms.com", "ROLE_LEARNER");
        var attempt = attemptService.start(quizId);

        AttemptSubmitRequest submit = new AttemptSubmitRequest();
        AttemptSubmitRequest.AnswerItem item = new AttemptSubmitRequest.AnswerItem();
        item.setQuestionId(question.getId());
        item.setSelectedOptionId(correctOptionId);
        submit.setAnswers(List.of(item));

        var graded = attemptService.submit(attempt.getId(), submit);
        assertEquals("graded", graded.getStatus());
        assertEquals(new BigDecimal("20"), graded.getMaxScore());
        assertEquals(new BigDecimal("50.00"), graded.getPercentage());
        assertFalse(graded.getPassed());
        assertEquals(correctOptionId, attemptService.getAnswers(attempt.getId()).get(0).getSelectedOptionId());

        assertThrows(RuntimeException.class, () -> attemptService.start(quizId));
    }
}
