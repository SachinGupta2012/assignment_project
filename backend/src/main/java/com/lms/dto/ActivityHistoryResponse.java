package com.lms.dto;

import java.time.LocalDateTime;

public class ActivityHistoryResponse {

    private final Long id;
    private final Long actorId;
    private final String actorName;
    private final String actorEmail;
    private final String actorRole;
    private final String action;
    private final String entityType;
    private final Long entityId;
    private final LocalDateTime createdAt;

    public ActivityHistoryResponse(Long id, Long actorId, String actorName, String actorEmail,
                                   String actorRole, String action, String entityType,
                                   Long entityId, LocalDateTime createdAt) {
        this.id = id;
        this.actorId = actorId;
        this.actorName = actorName;
        this.actorEmail = actorEmail;
        this.actorRole = actorRole;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getActorId() { return actorId; }
    public String getActorName() { return actorName; }
    public String getActorEmail() { return actorEmail; }
    public String getActorRole() { return actorRole; }
    public String getAction() { return action; }
    public String getEntityType() { return entityType; }
    public Long getEntityId() { return entityId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
