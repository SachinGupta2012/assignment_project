package com.lms.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lms.dto.AttemptAnswerResponse;
import com.lms.service.GradingService;

@RestController
@RequestMapping("/api/grading")
public class GradingController {

    private final GradingService gradingService;
    public GradingController(GradingService gradingService) {
        this.gradingService = gradingService;
    }

    @GetMapping("/queue")
    public ResponseEntity<List<AttemptAnswerResponse>> queue() {
        return ResponseEntity.ok(gradingService.queue());
    }

    @GetMapping("/graded")
    public ResponseEntity<List<AttemptAnswerResponse>> graded() {
        return ResponseEntity.ok(gradingService.graded());
    }

    @PatchMapping("/answers/{answerId}")
    public ResponseEntity<AttemptAnswerResponse> gradeAnswer(@PathVariable Long answerId,
                                                             @RequestParam BigDecimal points,
                                                             @RequestParam(required = false) String feedback,
                                                             @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(gradingService.gradeAnswer(answerId, points, feedback, reason));
    }
}
