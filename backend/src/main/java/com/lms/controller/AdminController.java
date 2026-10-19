package com.lms.controller;

import com.lms.dto.ActivityHistoryResponse;
import com.lms.dto.UserResponse;
import com.lms.service.ActivityService;
import com.lms.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;
    private final ActivityService activityService;

    public AdminController(UserService userService, ActivityService activityService) {
        this.userService = userService;
        this.activityService = activityService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PatchMapping("/users/{userId}/active")
    public ResponseEntity<UserResponse> setActive(@PathVariable Long userId,
                                                   @RequestParam boolean active) {
        return ResponseEntity.ok(userService.setActive(userId, active));
    }

    @GetMapping("/activity-history")
    public ResponseEntity<Page<ActivityHistoryResponse>> activityHistory(
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Pageable pageable) {
        return ResponseEntity.ok(activityService.search(actor, action, entityType, from, to, pageable));
    }
}
