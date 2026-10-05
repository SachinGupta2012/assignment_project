package com.lms.dto;
public class CourseResponse{
    private final Long id;
    private final String title;
    private final String description;
    private final String instructorName;
    private final boolean isPublished;
    private final Integer estimatedDuration;
    public CourseResponse(Long id, String title, String description, String instructorName, boolean isPublished, Integer estimatedDuration){
        this.id = id;
        this.title = title;
        this.description = description;
        this.instructorName = instructorName;
        this.isPublished= isPublished;
        this.estimatedDuration= estimatedDuration;

    }
    public Long getId(){return id;}
    public String gettitle(){return title;}
    public String getdescription(){return description;}
    public String getInstructorName(){return instructorName;}
    public boolean getisPublished(){return isPublished;}
    public Integer getestimatedDuration(){return estimatedDuration;}
}