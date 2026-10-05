package com.lms.controller;
import com.lms.dto.CourseRequest;
import com.lms.dto.CourseResponse;
import com.lms.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/courses")
public class CourseController {
    private final CourseService courseService;

    public CourseController(CourseService courseService){
        this.courseService = courseService;
    }
    @PostMapping
    public ResponseEntity<CourseResponse> create(@Valid @RequestBody CourseRequest request){
        CourseResponse created = courseService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    @GetMapping
    public ResponseEntity<List<CourseResponse>> getAll(){
        return ResponseEntity.ok(courseService.getAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getById(@PathVariable Long id){
        return ResponseEntity.ok(courseService.getById(id));
    }
    
}