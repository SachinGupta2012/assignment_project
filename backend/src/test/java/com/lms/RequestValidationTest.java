package com.lms;

import java.util.Set;

import org.junit.jupiter.api.Test;

import com.lms.dto.AssessmentRequest;
import com.lms.dto.CourseRequest;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class RequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    public void emptyCourseRequestFails() {
        Set<ConstraintViolation<CourseRequest>> violations = validator.validate(new CourseRequest());
        assertFalse(violations.isEmpty());
    }

    @Test
    public void courseRequestWithoutLevelFails() {
        CourseRequest request = new CourseRequest();
        request.setTitle("Java");
        request.setInstructorId(1L);
        Set<ConstraintViolation<CourseRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("level")));
    }

    @Test
    public void assessmentRequestWithoutCourseFails() {
        AssessmentRequest request = new AssessmentRequest();
        request.setTitle("Quiz");
        Set<ConstraintViolation<AssessmentRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("courseId")));
    }
}
