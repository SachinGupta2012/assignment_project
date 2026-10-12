package com.lms;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.lms.entity.Question;
import com.lms.entity.QuestionOption;
import com.lms.service.ScoringUtil;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class ScoringUtilTest {

    private Question singleChoice() {
        Question question = new Question();
        question.setId(1L);
        question.setPoints(new BigDecimal("10"));
        QuestionOption paris = new QuestionOption();
        paris.setId(11L);
        paris.setOptionText("Paris");
        paris.setIsCorrect(true);
        QuestionOption berlin = new QuestionOption();
        berlin.setId(12L);
        berlin.setOptionText("Berlin");
        berlin.setIsCorrect(false);
        question.setOptions(new ArrayList<>(List.of(paris, berlin)));
        return question;
    }

    @Test
    public void correctSingleChoiceEarnsFullPoints() {
        assertEquals(new BigDecimal("10"), ScoringUtil.scoreSingle(singleChoice(), 11L));
    }

    @Test
    public void wrongSingleChoiceEarnsZero() {
        assertEquals(BigDecimal.ZERO, ScoringUtil.scoreSingle(singleChoice(), 12L));
    }

    @Test
    public void exactMultipleChoiceMatchEarnsFullPoints() {
        Question question = singleChoice();
        assertTrue(ScoringUtil.isExactMatch(question, List.of(11L)));
        assertEquals(new BigDecimal("10"), ScoringUtil.scoreMultiple(question, List.of(11L)));
    }

    @Test
    public void partialMultipleChoiceMatchEarnsZero() {
        Question question = singleChoice();
        assertFalse(ScoringUtil.isExactMatch(question, List.of(11L, 12L)));
        assertEquals(BigDecimal.ZERO, ScoringUtil.scoreMultiple(question, List.of(11L, 12L)));
    }

    @Test
    public void percentageCalculation() {
        assertEquals(new BigDecimal("75.00"),
                ScoringUtil.percentage(new BigDecimal("75"), new BigDecimal("100")));
    }

    @Test
    public void passFailsCorrectly() {
        assertTrue(ScoringUtil.isPassed(new BigDecimal("80"), new BigDecimal("60")));
        assertFalse(ScoringUtil.isPassed(new BigDecimal("59.99"), new BigDecimal("60")));
    }
}
