package com.lms.service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lms.dto.ActivityHistoryResponse;
import com.lms.entity.ActivityHistory;
import com.lms.entity.User;
import com.lms.repository.ActivityHistoryRepository;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;

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

    @Transactional(readOnly = true)
    public Page<ActivityHistoryResponse> search(String actor, String action, String entityType,
                                                LocalDate from, LocalDate to, Pageable pageable) {
        Specification<ActivityHistory> filters = (root, query, builder) -> builder.conjunction();
        if (actor != null && !actor.isBlank()) {
            String pattern = "%" + actor.trim().toLowerCase() + "%";
            filters = filters.and((root, query, builder) -> {
                Join<ActivityHistory, User> user = root.join("user", JoinType.LEFT);
                return builder.or(
                        builder.like(builder.lower(user.get("firstName")), pattern),
                        builder.like(builder.lower(user.get("lastName")), pattern),
                        builder.like(builder.lower(user.get("email")), pattern));
            });
        }
        if (action != null && !action.isBlank()) {
            filters = filters.and((root, query, builder) ->
                    builder.equal(builder.lower(root.<String>get("action")), action.trim().toLowerCase()));
        }
        if (entityType != null && !entityType.isBlank()) {
            filters = filters.and((root, query, builder) ->
                    builder.equal(builder.lower(root.<String>get("entityType")), entityType.trim().toLowerCase()));
        }
        if (from != null) {
            filters = filters.and((root, query, builder) ->
                    builder.greaterThanOrEqualTo(root.<LocalDateTime>get("createdAt"), from.atStartOfDay()));
        }
        if (to != null) {
            filters = filters.and((root, query, builder) ->
                    builder.lessThan(root.<LocalDateTime>get("createdAt"), to.plusDays(1).atStartOfDay()));
        }

        Pageable sortedPage = pageable.getSort().isSorted()
                ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                        Sort.by(Sort.Direction.DESC, "createdAt"));
        return activityHistoryRepository.findAll(filters, sortedPage).map(this::toResponse);
    }

    private ActivityHistoryResponse toResponse(ActivityHistory history) {
        User actor = history.getUser();
        String role = actor == null || actor.getRoles().isEmpty()
                ? null
                : actor.getRoles().iterator().next().getName();
        return new ActivityHistoryResponse(
                history.getId(),
                actor == null ? null : actor.getId(),
                actor == null ? "System" : actor.getFirstName() + " " + actor.getLastName(),
                actor == null ? null : actor.getEmail(),
                role,
                history.getAction(),
                history.getEntityType(),
                history.getEntityId(),
                history.getCreatedAt());
    }
}
