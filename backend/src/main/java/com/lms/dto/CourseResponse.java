package com.lms.dto;
public class CourseResponse{
    private Long id;
    private String title;
    private String description;
    private String instructorName;
    private boolean isPublished;
    private Integer estimatedDuration;
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
    public String getinstructotName(){return instructorName;}
    public boolean getisPublished(){return isPublished;}
    public Integer getestimatedDuration(){return estimatedDuration;}
}