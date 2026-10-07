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

import com.lms.dto.ModuleRequest;
import com.lms.dto.ModuleResponse;
import com.lms.service.ModuleService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/courses/{courseId}/modules")
public class ModuleController {

    private final ModuleService moduleService;
    public ModuleController(ModuleService moduleService) {
        this.moduleService = moduleService;
    }

    @PostMapping
    public ResponseEntity<ModuleResponse> create(@PathVariable Long courseId,
                                                 @Valid @RequestBody ModuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(moduleService.create(courseId, request));
    }

    @GetMapping
    public ResponseEntity<List<ModuleResponse>> getAll(@PathVariable Long courseId) {
        return ResponseEntity.ok(moduleService.getByCourse(courseId));
    }
}