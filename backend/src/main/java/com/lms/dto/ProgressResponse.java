package com.lms.dto;

public class ProgressResponse {
    private final Long courseId;
    private final Long learnerId;
    private final int requiredLessonsTotal;
    private final int requiredLessonsDone;
    private final int requiredAssessmentsTotal;
    private final int requiredAssessmentsPassed;
    private final int percentage;

    public ProgressResponse(Long courseId, Long learnerId, int requiredLessonsTotal,
                            int requiredLessonsDone, int requiredAssessmentsTotal,
                            int requiredAssessmentsPassed, int percentage) {
        this.courseId = courseId;
        this.learnerId = learnerId;
        this.requiredLessonsTotal = requiredLessonsTotal;
        this.requiredLessonsDone = requiredLessonsDone;
        this.requiredAssessmentsTotal = requiredAssessmentsTotal;
        this.requiredAssessmentsPassed = requiredAssessmentsPassed;
        this.percentage = percentage;
    }

    public Long getCourseId() { return courseId; }
    public Long getLearnerId() { return learnerId; }
    public int getRequiredLessonsTotal() { return requiredLessonsTotal; }
    public int getRequiredLessonsDone() { return requiredLessonsDone; }
    public int getRequiredAssessmentsTotal() { return requiredAssessmentsTotal; }
    public int getRequiredAssessmentsPassed() { return requiredAssessmentsPassed; }
    public int getPercentage() { return percentage; }
}
