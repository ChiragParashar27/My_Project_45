// src/main/java/com/ems/backend/service/UserService.java
package com.ems.backend.service;
import lombok.*;
import com.ems.backend.dto.UserRegistrationDto;
import com.ems.backend.entity.Role;
import com.ems.backend.entity.User;
import com.ems.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import com.ems.backend.entity.PasswordValidator;

import java.time.LocalDate;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    // Admin creates new employee
    public User registerUser(UserRegistrationDto dto) {
        if (!PasswordValidator.isValid(dto.getPassword())) { // ✅ Added password validation
            throw new IllegalArgumentException("Password does not meet complexity requirements.");
        }
        User user = User.builder()
                .name(dto.getName())
                .username(dto.getUsername())
                .password(passwordEncoder.encode(dto.getPassword()))
                .contactNumber(dto.getContactNumber())
                .department(dto.getDepartment())
                .designation(dto.getDesignation())
                .dateOfJoining(dto.getDateOfJoining())
                .role(Role.valueOf(dto.getRole().toUpperCase()))
                .approved(true)
                .firstLogin(true)
                .active(true)
                .build();
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateUser(Long id, UserRegistrationDto dto) {
        User user = getUserById(id);
        user.setName(dto.getName());
        user.setContactNumber(dto.getContactNumber());
        user.setDepartment(dto.getDepartment());
        user.setDesignation(dto.getDesignation());
        user.setDateOfJoining(dto.getDateOfJoining());
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    // ✅ New: Approve a user and set their joining date
    public void approveUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isApproved()) {
            throw new RuntimeException("User is already approved.");
        }

        user.setApproved(true);
        user.setDateOfJoining(LocalDate.now()); // ✅ Set date of joining on approval
        userRepository.save(user);

        try {
            emailService.sendAccountApprovalEmail(user.getUsername(), user.getName());
        } catch (MessagingException e) {
            System.err.println("Failed to send account approval email to " + user.getUsername());
        }
    }
}