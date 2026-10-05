package com.lms.service;
import com.lms.dto.CourseRequest;
import com.lms.dto.CourseResponse;
import com.lms.entity.Course;
import com.lms.entity.User;
import com.lms.repository.CourseRepository;
import com.lms.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CourseService{
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public CourseService(CourseRepository courseRepository, UserRepository userRepository){
        this.courseRepository=courseRepository;
        this.userRepository= userRepository;
    }

    @Transactional
    public CourseResponse create(CourseRequest request){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
    }
}