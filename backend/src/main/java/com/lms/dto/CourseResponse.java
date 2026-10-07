package com.lms.dto;
public class CourseResponse{
    private final Long id;
    private final String title;
    private final String description;
    private final String instructorName;
    private final boolean isPublished;
    private final Integer estimatedDuration;
    private final String level;
    private final String enrollmentMode;
    public CourseResponse(Long id, String title, String description, String instructorName, boolean isPublished, Integer estimatedDuration, String level, String enrollmentMode){
        this.id = id;
        this.title = title;
        this.description = description;
        this.instructorName = instructorName;
        this.isPublished= isPublished;
        this.estimatedDuration= estimatedDuration;
        this.level=level;
        this.enrollmentMode=enrollmentMode;
    }
    public Long getId(){return id;}
    public String getTitle(){return title;}
    public String getDescription(){return description;}
    public String getInstructorName(){return instructorName;}
    public boolean getIsPublished(){return isPublished;}
    public Integer getEstimatedDuration(){return estimatedDuration;}
    public String getLevel(){return level;}
    public String getEnrollmentMode(){return enrollmentMode;}
}