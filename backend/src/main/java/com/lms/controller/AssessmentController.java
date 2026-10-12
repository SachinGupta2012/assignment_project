package com.lms.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lms.dto.AssessmentRequest;
import com.lms.dto.AssessmentResponse;
import com.lms.dto.QuestionDetailResponse;
import com.lms.dto.QuestionRequest;
import com.lms.dto.QuestionResponse;
import com.lms.service.AssessmentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class AssessmentController {

    private final AssessmentService assessmentService;
    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @PostMapping("/courses/{courseId}/assessments")
    public ResponseEntity<AssessmentResponse> create(@PathVariable Long courseId, @Valid @RequestBody AssessmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assessmentService.create(courseId, request));
    }

    @GetMapping("/courses/{courseId}/assessments")
    public ResponseEntity<Page<AssessmentResponse>> getByCourse(@PathVariable Long courseId, Pageable pageable) {
        return ResponseEntity.ok(assessmentService.getByCourse(courseId, pageable));
    }

    @PostMapping("/assessments/{assessmentId}/questions")
    public ResponseEntity<QuestionDetailResponse> addQuestion(@PathVariable Long assessmentId, @Valid @RequestBody QuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assessmentService.addQuestion(assessmentId, request));
    }

    @GetMapping("/assessments/{assessmentId}/questions")
    public ResponseEntity<List<QuestionResponse>> getQuestions(@PathVariable Long assessmentId) {
        return ResponseEntity.ok(assessmentService.getQuestions(assessmentId));
    }

    @GetMapping("/assessments/{assessmentId}/questions/with-answers")
    public ResponseEntity<List<QuestionDetailResponse>> getQuestionsWithAnswers(
            @PathVariable Long assessmentId) {
        return ResponseEntity.ok(assessmentService.getQuestionsWithAnswers(assessmentId));
    }
}
