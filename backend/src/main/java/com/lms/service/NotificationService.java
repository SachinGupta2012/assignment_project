package com.lms.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dto.NotificationResponse;
import com.lms.entity.Enrollment;
import com.lms.entity.Notification;
import com.lms.entity.User;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.NotificationRepository;
import com.lms.repository.UserRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               EnrollmentRepository enrollmentRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    @Transactional
    public void create(User user, String type, String title, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> myNotifications(Pageable pageable) {
        User me = getCurrentUser();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(me.getId(), pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long unreadCount() {
        User me = getCurrentUser();
        return notificationRepository.countByUserIdAndIsReadFalse(me.getId());
    }

    @Transactional
    public NotificationResponse markRead(Long notificationId) {
        User me = getCurrentUser();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + notificationId));
        if (!notification.getUser().getId().equals(me.getId())) {
            throw new RuntimeException("You can only read your own notifications");
        }
        notification.setIsRead(true);
        return toResponse(notification);
    }

    @Transactional
    public void markAllRead() {
        Page<NotificationResponse> page = myNotifications(PageRequest.of(0, 1000));
        for (NotificationResponse item : page.getContent()) {
            Notification notification = notificationRepository.findById(item.getId())
                    .orElseThrow(() -> new RuntimeException("Notification not found: " + item.getId()));
            notification.setIsRead(true);
        }
    }

    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional
    public void remindDueDates() {
        LocalDateTime tomorrowStart = LocalDateTime.now().plusDays(1).toLocalDate().atStartOfDay();
        LocalDateTime tomorrowEnd = tomorrowStart.plusDays(1);
        List<Enrollment> all = enrollmentRepository.findAll();
        for (Enrollment enrollment : all) {
            if (!"approved".equals(enrollment.getStatus())) {
                continue;
            }
            if (enrollment.getDueDate() == null) {
                continue;
            }
            if (!enrollment.getDueDate().isBefore(tomorrowStart)
                    && enrollment.getDueDate().isBefore(tomorrowEnd)) {
                create(enrollment.getUser(), "DUE_DATE",
                        "Due tomorrow: " + enrollment.getCourse().getTitle(),
                        "Your enrollment is due on " + enrollment.getDueDate().toLocalDate());
            }
        }
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged-in user not found"));
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getType(), n.getTitle(),
                n.getMessage(), n.getIsRead(), n.getCreatedAt());
    }
}
