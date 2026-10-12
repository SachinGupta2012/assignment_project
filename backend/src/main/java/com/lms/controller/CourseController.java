package com.lms.controller;
import com.lms.dto.CourseRequest;
import com.lms.dto.CourseResponse;
import com.lms.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<Page<CourseResponse>> getAll(Pageable pageable){
        return ResponseEntity.ok(courseService.getAll(pageable));
    }
    @GetMapping("/search")
    public ResponseEntity<Page<CourseResponse>> search(@RequestParam(required = false) String title,
                                                       @RequestParam(required = false) String level,
                                                       @RequestParam(required = false) Long instructorId,
                                                       @RequestParam(required = false) Boolean published,
                                                       @RequestParam(required = false) Boolean archived,
                                                       @RequestParam(required = false) String tag,
                                                       Pageable pageable){
        return ResponseEntity.ok(courseService.search(title, level, instructorId, published, archived, tag, pageable));
    }
    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getById(@PathVariable Long id){
        return ResponseEntity.ok(courseService.getById(id));
    }
    @PutMapping("/{id}")
    public ResponseEntity<CourseResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody CourseRequest request){
        return ResponseEntity.ok(courseService.update(id, request));
    }
    @PatchMapping("/{id}/status")
    public ResponseEntity<CourseResponse> updateStatus(@PathVariable Long id,
                                                       @RequestParam(required = false) Boolean published,
                                                       @RequestParam(required = false) Boolean archived){
        return ResponseEntity.ok(courseService.updateStatus(id, published, archived));
    }
}
