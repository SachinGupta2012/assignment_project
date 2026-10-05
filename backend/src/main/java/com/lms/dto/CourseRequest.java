package com.lms.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CourseRequest{
    @NotBlank(message="Title must not be blank")
    @Size(max=500, message=Title at most )
    private String Title;
    private String description;

    @NotBlank(message="Instructor id can't be blank")
    private Long instructorId;
    private Integer estimateDuration;
    
    public CourseRequest(){}
    public String getTitle(){return title;}
    public void setTitle(String Title){this.title = title;}
    public String getDescription(){return description;}
    public String setDescription(String description){this.description = description;}

    public Long getInstructorId(){return instructorId;}
    public void setInstructorId(Long instructorId){this.instructorId=instructorId;}
    publiv Integer getestimatedDuration(){return estimatedDuration;}
    public void setestimatedDuration(Integer estimatedDuration){this.estimatedDuration = estimatedDuration;}

}
