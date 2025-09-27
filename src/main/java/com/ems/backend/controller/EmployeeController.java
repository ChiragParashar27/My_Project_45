package com.ems.backend.controller;

import com.ems.backend.entity.User;
import com.ems.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/employee")
public class EmployeeController {

    @Autowired
    private UserRepository userRepository;

    // Get employee profile
    @GetMapping("/me")
    public User getProfile(@AuthenticationPrincipal User user) {
        return user;
    }

    // Update employee profile (only their own data)
    @PutMapping("/update")
    public User updateProfile(@AuthenticationPrincipal User currentUser, @RequestBody User updatedData) {
        currentUser.setName(updatedData.getName());
        currentUser.setUsername(updatedData.getUsername());
        currentUser.setContactNumber(updatedData.getContactNumber());
        currentUser.setDepartment(updatedData.getDepartment());
        currentUser.setDesignation(updatedData.getDesignation());
        // ✅ Update new fields
        currentUser.setEmergencyContactName(updatedData.getEmergencyContactName());
        currentUser.setEmergencyContactNumber(updatedData.getEmergencyContactNumber());
        return userRepository.save(currentUser);
    }

    // ✅ New: Endpoint for uploading profile picture
    @PostMapping("/upload-photo")
    public String uploadProfilePicture(@AuthenticationPrincipal User user, @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return "Please select a file to upload.";
        }

        try {
            // Define upload directory and create it if it doesn't exist
            String uploadDir = "uploads/profile-pictures/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Save the file and update the user's profile picture URL
            String fileName = user.getId() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            user.setProfilePictureUrl(uploadDir + fileName);
            userRepository.save(user);

            return "Profile picture uploaded successfully!";

        } catch (IOException e) {
            e.printStackTrace();
            return "Failed to upload file.";
        }
    }
}