package com.lms.repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lms.entity.Course;


@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    Page<Course> findByIsPublishedTrueAndIsArchivedFalse(Pageable pageable);

    @Query("select c from Course c where "
         + "(:title is null or lower(c.title) like lower(concat('%', :title, '%'))) and "
         + "(:level is null or c.level = :level) and "
         + "(:instructorId is null or c.instructor.id = :instructorId) and "
         + "(:published is null or c.isPublished = :published) and "
         + "(:archived is null or c.isArchived = :archived) and "
         + "(:tag is null or lower(c.tags) like lower(concat('%', :tag, '%')))")
    Page<Course> search(@Param("title") String title,
                        @Param("level") String level,
                        @Param("instructorId") Long instructorId,
                        @Param("published") Boolean published,
                        @Param("archived") Boolean archived,
                        @Param("tag") String tag,
                        Pageable pageable);
}
