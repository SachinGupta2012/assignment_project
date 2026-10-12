package com.lms.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lms.entity.ActivityHistory;
import com.lms.entity.User;
import com.lms.repository.ActivityHistoryRepository;

@Service
public class ActivityService {

    private final ActivityHistoryRepository activityHistoryRepository;

    public ActivityService(ActivityHistoryRepository activityHistoryRepository) {
        this.activityHistoryRepository = activityHistoryRepository;
    }

    @Transactional
    public void record(User user, String action, String entityType, Long entityId) {
        ActivityHistory history = new ActivityHistory();
        history.setUser(user);
        history.setAction(action);
        history.setEntityType(entityType);
        history.setEntityId(entityId);
        activityHistoryRepository.save(history);
    }
}
