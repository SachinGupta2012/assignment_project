package com.lms.dto;

public class LessonResponse {
    private final Long id;
    private final Long moduleId;
    private final String title;
    private final String contentType;
    private final String contentUrl;
    private final String contentBody;
    private final Integer displayOrder;
    private final Boolean isRequired;
    private final Integer duration;

    public LessonResponse(Long id, Long moduleId, String title, String contentType,
                          String contentUrl, String contentBody, Integer displayOrder,
                          Boolean isRequired, Integer duration) {
        this.id = id;
        this.moduleId = moduleId;
        this.title = title;
        this.contentType = contentType;
        this.contentUrl = contentUrl;
        this.contentBody = contentBody;
        this.displayOrder = displayOrder;
        this.isRequired = isRequired;
        this.duration = duration;
    }

    public Long getId() { return id; }
    public Long getModuleId() { return moduleId; }
    public String getTitle() { return title; }
    public String getContentType() { return contentType; }
    public String getContentUrl() { return contentUrl; }
    public String getContentBody() { return contentBody; }
    public Integer getDisplayOrder() { return displayOrder; }
    public Boolean getIsRequired() { return isRequired; }
    public Integer getDuration() { return duration; }
}