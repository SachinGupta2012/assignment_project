package com.lms.dto;

public class ModuleResponse {
    private final Long id;
    private final Long courseId;
    private final String title;
    private final String description;
    private final Integer displayOrder;
    private final Boolean isRequired;

    public ModuleResponse(Long id, Long courseId, String title, String description,
                          Integer displayOrder, Boolean isRequired) {
        this.id = id;
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.displayOrder = displayOrder;
        this.isRequired = isRequired;
    }

    public Long getId() { return id; }
    public Long getCourseId() { return courseId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Integer getDisplayOrder() { return displayOrder; }
    public Boolean getIsRequired() { return isRequired; }
}