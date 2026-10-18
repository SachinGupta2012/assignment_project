package com.lms.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lms.dto.AttemptResponse;
import com.lms.dto.AttemptAnswerResponse;
import com.lms.dto.AttemptSubmitRequest;
import com.lms.service.AttemptService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class AttemptController {

    private final AttemptService attemptService;
    public AttemptController(AttemptService attemptService) {
        this.attemptService = attemptService;
    }

    @PostMapping("/assessments/{assessmentId}/attempts")
    public ResponseEntity<AttemptResponse> start(@PathVariable Long assessmentId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(attemptService.start(assessmentId));
    }

    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<AttemptResponse> submit(@PathVariable Long attemptId,
                                                  @Valid @RequestBody AttemptSubmitRequest request) {
        return ResponseEntity.ok(attemptService.submit(attemptId, request));
    }

    @PatchMapping("/attempts/{attemptId}/answers")
    public ResponseEntity<AttemptResponse> saveDraft(@PathVariable Long attemptId,
                                                     @Valid @RequestBody AttemptSubmitRequest request) {
        return ResponseEntity.ok(attemptService.saveDraft(attemptId, request));
    }

    @GetMapping("/assessments/{assessmentId}/attempts/me")
    public ResponseEntity<List<AttemptResponse>> myAttempts(@PathVariable Long assessmentId) {
        return ResponseEntity.ok(attemptService.myAttempts(assessmentId));
    }

    @GetMapping("/attempts/{attemptId}/answers")
    public ResponseEntity<List<AttemptAnswerResponse>> getAnswers(@PathVariable Long attemptId) {
        return ResponseEntity.ok(attemptService.getAnswers(attemptId));
    }
}
