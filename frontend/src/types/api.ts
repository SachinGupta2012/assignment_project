export type Role = "ADMIN" | "TRAINING_MANAGER" | "INSTRUCTOR" | "LEARNER";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface LoginResponse {
  token: string;
  email: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface Course {
  id: number;
  title: string;
  description: string | null;
  instructorId: number;
  instructorName: string;
  isPublished: boolean;
  estimatedDuration: number | null;
  level: string;
  enrollmentMode: string;
  isArchived: boolean;
  tags: string | null;
}

export interface Enrollment {
  id: number;
  courseId: number;
  learnerId: number;
  learnerName: string;
  status: string;
  dueDate: string | null;
  enrolledAt: string;
}

export interface CourseModule {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  displayOrder: number;
  isRequired: boolean;
}

export interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  contentType: string;
  contentUrl: string | null;
  contentBody: string | null;
  displayOrder: number;
  isRequired: boolean;
  duration: number | null;
}

export interface Assessment {
  id: number;
  courseId: number;
  moduleId: number | null;
  title: string;
  description: string | null;
  passingScore: number;
  maxScore: number;
  timeLimitMinutes: number | null;
  maxAttempts: number;
  isRequired: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface QuestionOption {
  id: number;
  optionText: string;
  displayOrder: number;
}

export interface Question {
  id: number;
  questionText: string;
  questionType: "single_choice" | "multiple_choice" | "short_answer";
  points: number;
  displayOrder: number;
  options: QuestionOption[];
}

export interface QuestionOptionDetail extends QuestionOption {
  isCorrect: boolean;
}

export interface QuestionDetail extends Omit<Question, "options"> {
  correctAnswer: string | null;
  explanation: string | null;
  options: QuestionOptionDetail[];
}

export interface Attempt {
  id: number;
  assessmentId: number;
  learnerId: number;
  attemptNumber: number;
  status: string;
  score: number;
  maxScore: number;
  percentage: number | null;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
}

export interface AttemptAnswer {
  id: number;
  attemptId: number;
  attemptNumber: number;
  questionId: number;
  questionText: string;
  answerText: string | null;
  selectedOptionId: number | null;
  selectedOptionText: string | null;
  points: number;
  pointsAwarded: number;
  feedback: string | null;
}

export interface Progress {
  courseId: number;
  learnerId: number;
  requiredLessonsTotal: number;
  requiredLessonsDone: number;
  requiredAssessmentsTotal: number;
  requiredAssessmentsPassed: number;
  percentage: number;
}

export interface LessonCompletion {
  lessonId: number;
  learnerId: number;
  completedAt: string;
}

export interface AnswerItem {
  questionId: number;
  selectedOptionId?: number;
  selectedOptionIds?: number[];
  answerText?: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityHistoryRecord {
  id: number;
  actorId: number | null;
  actorName: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entityType: string | null;
  entityId: number | null;
  createdAt: string;
}

export interface CourseReport {
  courseId: number;
  enrolledTotal: number;
  approved: number;
  pending: number;
  completed: number;
  overdue: number;
  avgScore: number;
  passRate: number;
}
