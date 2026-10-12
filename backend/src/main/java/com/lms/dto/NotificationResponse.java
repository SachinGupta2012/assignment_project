package com.lms.dto;

import java.time.LocalDateTime;

public class NotificationResponse {
    private final Long id;
    private final String type;
    private final String title;
    private final String message;
    private final Boolean isRead;
    private final LocalDateTime createdAt;

    public NotificationResponse(Long id, String type, String title, String message,
                                Boolean isRead, LocalDateTime createdAt) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.message = message;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getType() { return type; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public Boolean getIsRead() { return isRead; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
