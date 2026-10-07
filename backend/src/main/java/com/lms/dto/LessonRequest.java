package com.lms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class LessonRequest {

    @NotBlank(message = "title must not be blank")
    @Size(max = 500, message = "title must be at most 500 characters")
    private String title;
    private String contentType = "text";

    @Size(max = 1000, message = "contentUrl must be at most 1000 characters")
    private String contentUrl;

    private String contentBody;

    @NotNull(message = "displayOrder must not be blank")
    private Integer displayOrder;

    private Boolean isRequired = true;

    private Integer duration;

    public LessonRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public String getContentUrl() { return contentUrl; }
    public void setContentUrl(String contentUrl) { this.contentUrl = contentUrl; }
    public String getContentBody() { return contentBody; }
    public void setContentBody(String contentBody) { this.contentBody = contentBody; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public Boolean getIsRequired() { return isRequired; }
    public void setIsRequired(Boolean isRequired) { this.isRequired = isRequired; }
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
}