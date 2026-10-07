package com.lms.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lms.dto.LessonRequest;
import com.lms.dto.LessonResponse;
import com.lms.service.LessonService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/courses/{courseId}/modules/{moduleId}/lessons")
public class LessonController {

    private final LessonService lessonService;
    public LessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @PostMapping
    public ResponseEntity<LessonResponse> create(@PathVariable Long courseId,
                                                 @PathVariable Long moduleId,
                                                 @Valid @RequestBody LessonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(lessonService.create(courseId, moduleId, request));
    }

    @GetMapping
    public ResponseEntity<List<LessonResponse>> getAll(@PathVariable Long courseId,
                                                       @PathVariable Long moduleId) {
        return ResponseEntity.ok(lessonService.getByModule(courseId, moduleId));
    }
}