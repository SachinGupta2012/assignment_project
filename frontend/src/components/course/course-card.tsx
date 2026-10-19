import Link from "next/link";
import type { Course } from "@/types/api";
import { Badge } from "@/components/ui/display";
import { Icon } from "@/components/ui/icon";

interface CourseCardProps {
  course: Course;
  action?: React.ReactNode;
}

export function CourseCard({ course, action }: CourseCardProps) {
  return (
    <article className="course-card">
      <Link href={`/courses/${course.id}`} className="course-cover" aria-label={`Open ${course.title}`}>
        <span><Icon name="book" size={26} /></span>
      </Link>
      <div className="course-card-body">
        <div className="course-card-copy">
          <Link href={`/courses/${course.id}`}><h2>{course.title}</h2></Link>
          <p>{course.description || "No description has been added yet."}</p>
        </div>
        <div className="course-meta">
          <Badge>{course.level}</Badge>
          {course.estimatedDuration ? <span><Icon name="clock" size={14} />{course.estimatedDuration} min</span> : null}
        </div>
        {action ? <div className="course-card-action">{action}</div> : null}
      </div>
    </article>
  );
}
