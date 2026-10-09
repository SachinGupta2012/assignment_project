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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lms.dto.EnrollmentRequest;
import com.lms.dto.EnrollmentResponse;
import com.lms.service.EnrollmentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    @PostMapping("/courses/{courseId}/enrollments")
    public ResponseEntity<EnrollmentResponse> enroll(@PathVariable Long courseId,@Valid @RequestBody EnrollmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(enrollmentService.enroll(courseId, request));
    }

    @GetMapping("/courses/{courseId}/enrollments")
    public ResponseEntity<List<EnrollmentResponse>> getByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(enrollmentService.getByCourse(courseId));
    }

    @PatchMapping("/enrollments/{enrollmentId}")
    public ResponseEntity<EnrollmentResponse> updateStatus(@PathVariable Long enrollmentId,@RequestParam String status) {
        return ResponseEntity.ok(enrollmentService.updateStatus(enrollmentId, status));
    }
}