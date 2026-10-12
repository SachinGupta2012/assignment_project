package com.lms.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lms.dto.LessonCompletionResponse;
import com.lms.dto.LessonResponse;
import com.lms.dto.ProgressResponse;
import com.lms.service.ProgressService;

@RestController
@RequestMapping("/api")
public class ProgressController {

    private final ProgressService progressService;
    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @PostMapping("/lessons/{lessonId}/complete")
    public ResponseEntity<LessonCompletionResponse> complete(@PathVariable Long lessonId) {
        return ResponseEntity.ok(progressService.completeLesson(lessonId));
    }

    @GetMapping("/courses/{courseId}/progress")
    public ResponseEntity<ProgressResponse> progress(@PathVariable Long courseId,
                                                     @RequestParam(required = false) Long learnerId) {
        return ResponseEntity.ok(progressService.getProgress(courseId, learnerId));
    }

    @GetMapping("/courses/{courseId}/resume")
    public ResponseEntity<LessonResponse> resume(@PathVariable Long courseId) {
        return ResponseEntity.ok(progressService.resume(courseId));
    }
}
