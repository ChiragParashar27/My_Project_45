// src/main/java/com/ems/backend/controller/UserController.java
package com.ems.backend.controller;

import com.ems.backend.dto.UserRegistrationDto;
import com.ems.backend.entity.User;
import com.ems.backend.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ✅ Admin creates new employee
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register")
    public User registerUser(@RequestBody UserRegistrationDto dto) {
        return userService.registerUser(dto);
    }

    // ✅ Admin: Get all employees
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // ✅ Get employee by ID (Admin or employee self)
    @PreAuthorize("hasRole('ADMIN')") // ✅ Added PreAuthorize for security
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    // ✅ Admin: Update employee details
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/update/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody UserRegistrationDto dto) {
        return userService.updateUser(id, dto);
    }

    // ✅ Admin: Delete employee
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete/{id}")
    public String deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return "User deleted successfully";
    }

    // ✅ New: Admin approves pending user and sets joining date
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/approve/{userId}")
    public ResponseEntity<String> approveUser(@PathVariable Long userId) {
        try {
            userService.approveUser(userId);
            return ResponseEntity.ok("User approved successfully!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}