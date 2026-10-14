package com.lms.controller;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lms.dto.CourseReportResponse;
import com.lms.service.ReportService;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/courses/{courseId}/summary")
    public ResponseEntity<CourseReportResponse> summary(@PathVariable Long courseId) {
        return ResponseEntity.ok(reportService.courseSummary(courseId));
    }

    @GetMapping("/enrollments/export")
    public ResponseEntity<String> exportEnrollments(@RequestParam(required = false) Long courseId,
                                                    @RequestParam(required = false) String status,
                                                    @RequestParam(required = false) Long instructorId,
                                                    @RequestParam(required = false) Long learnerId,
                                                    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
                                                    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        String csv = reportService.exportEnrollments(courseId, status, instructorId, learnerId, from, to);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=enrollments.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/results/export")
    public ResponseEntity<String> exportResults(@RequestParam Long courseId,
                                                @RequestParam(required = false) Long learnerId,
                                                @RequestParam(required = false) String status,
                                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
                                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        String csv = reportService.exportResults(courseId, learnerId, status, from, to);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=results.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
