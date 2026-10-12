package com.lms.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import com.lms.entity.Question;
import com.lms.entity.QuestionOption;

public class ScoringUtil {

    public static BigDecimal scoreSingle(Question question, Long pickedOptionId) {
        if (pickedOptionId == null) {
            return BigDecimal.ZERO;
        }
        for (QuestionOption option : question.getOptions()) {
            if (option.getId().equals(pickedOptionId)) {
                if (Boolean.TRUE.equals(option.getIsCorrect())) {
                    return question.getPoints();
                }
                return BigDecimal.ZERO;
            }
        }
        throw new RuntimeException("Option " + pickedOptionId + " does not belong to question " + question.getId());
    }

    public static boolean isExactMatch(Question question, List<Long> pickedIds) {
        List<Long> correctIds = new ArrayList<>();
        for (QuestionOption option : question.getOptions()) {
            if (Boolean.TRUE.equals(option.getIsCorrect())) {
                correctIds.add(option.getId());
            }
        }
        if (pickedIds == null || pickedIds.size() != correctIds.size()) {
            return false;
        }
        for (Long id : pickedIds) {
            if (!correctIds.contains(id)) {
                return false;
            }
        }
        return true;
    }

    public static BigDecimal scoreMultiple(Question question, List<Long> pickedIds) {
        if (isExactMatch(question, pickedIds)) {
            return question.getPoints();
        }
        return BigDecimal.ZERO;
    }

    public static BigDecimal percentage(BigDecimal score, BigDecimal max) {
        if (max == null || max.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return score.multiply(new BigDecimal("100")).divide(max, 2, RoundingMode.HALF_UP);
    }

    public static boolean isPassed(BigDecimal percentage, BigDecimal passingScore) {
        if (percentage == null || passingScore == null) {
            return false;
        }
        return percentage.compareTo(passingScore) >= 0;
    }
}
