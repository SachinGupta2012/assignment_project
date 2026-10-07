package com.lms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ModuleRequest {

    @NotBlank(message = "title must not be blank")
    @Size(max = 500, message = "title must be at most 500 characters")
    private String title;

    private String description;

    @NotNull(message = "displayOrder must not be blank")
    private Integer displayOrder;

    private Boolean isRequired = true; 

    public ModuleRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public Boolean getIsRequired() { return isRequired; }
    public void setIsRequired(Boolean isRequired) { this.isRequired = isRequired; }
}