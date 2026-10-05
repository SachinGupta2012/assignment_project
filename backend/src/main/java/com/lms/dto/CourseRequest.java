package com.lms.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CourseRequest{
    @NotBlank(message="Title must not be blank")
    @Size(max=500, message="Title must be at most 500 characters")
    private String title;
    private String description;

    @NotNull(message="Instructor id can't be blank")
    private Long instructorId;
    private Integer estimateDuration;
    
    public CourseRequest(){}
    public String getTitle(){return title;}
    public void setTitle(String title){this.title = title;}
    public String getDescription(){return description;}
    public void setDescription(String description){this.description = description;}

    public Long getInstructorId(){return instructorId;}
    public void setInstructorId(Long instructorId){this.instructorId=instructorId;}
    public Integer getEstimateDuration(){return estimateDuration;}
    public void setEstimateDuration(Integer estimateDuration){this.estimateDuration = estimateDuration;}

}
