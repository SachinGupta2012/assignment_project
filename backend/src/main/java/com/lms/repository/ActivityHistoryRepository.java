package com.lms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.lms.entity.ActivityHistory;

@Repository
public interface ActivityHistoryRepository extends JpaRepository<ActivityHistory, Long>,
        JpaSpecificationExecutor<ActivityHistory> {
    List<ActivityHistory> findByEntityTypeAndEntityId(String entityType, Long entityId);
    List<ActivityHistory> findByUserId(Long userId);
}
