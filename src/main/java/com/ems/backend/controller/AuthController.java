package com.ems.backend.controller;

import com.ems.backend.auth.JwtUtil;
import com.ems.backend.dto.AuthRequest;
import com.ems.backend.dto.AuthResponse;
import com.ems.backend.dto.PasswordResetRequest;
import com.ems.backend.dto.RefreshTokenRequest;
import com.ems.backend.entity.Attendance;
import com.ems.backend.entity.Role;
import com.ems.backend.entity.User;
import com.ems.backend.entity.PasswordValidator;
import com.ems.backend.repository.AttendanceRepository;
import com.ems.backend.repository.UserRepository;
import com.ems.backend.service.EmailService;
import com.ems.backend.service.RefreshTokenService;
import com.ems.backend.service.PasswordResetTokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.mail.MessagingException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AttendanceRepository attendanceRepository;
    private final RefreshTokenService refreshTokenService;
    private final PasswordResetTokenService passwordResetTokenService;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          EmailService emailService,
                          AttendanceRepository attendanceRepository,
                          RefreshTokenService refreshTokenService,
                          PasswordResetTokenService passwordResetTokenService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.attendanceRepository = attendanceRepository;
        this.refreshTokenService = refreshTokenService;
        this.passwordResetTokenService = passwordResetTokenService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        if (!PasswordValidator.isValid(user.getPassword())) {
            return ResponseEntity.badRequest().body("Password does not meet complexity requirements.");
        }
        if (userRepository.existsByUsername(user.getUsername())) {
            return ResponseEntity.badRequest().body("User already exists with this username");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(Role.EMPLOYEE);
        user.setApproved(false);
        user.setFirstLogin(true);
        userRepository.save(user);

        try {
            emailService.sendRegistrationPendingEmail(user.getUsername(), user.getName());
        } catch (MessagingException | MailException e) {
            System.err.println("Failed to send registration email to " + user.getUsername());
        }

        return ResponseEntity.ok("Registration successful; awaiting admin approval.");
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody AuthRequest authRequest) {
        Optional<User> maybeUser = userRepository.findByUsername(authRequest.getUsername());
        if (maybeUser.isEmpty()) {
            return ResponseEntity.badRequest().body("Incorrect username or password");
        }
        User user = maybeUser.get();

        if (!user.isApproved()) {
            return ResponseEntity.badRequest().body("Your account is pending admin approval.");
        }

        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
            );

            String token = jwtUtil.generateToken((UserDetails) auth.getPrincipal());
            boolean mustReset = user.isFirstLogin();

            // ---- AUTO CHECK-IN ----
            LocalDate today = LocalDate.now();
            attendanceRepository.findByEmployeeIdAndDate(user.getId(), today)
                    .orElseGet(() -> {
                        Attendance attendance = Attendance.builder()
                                .employeeId(user.getId())
                                .date(today)
                                .checkIn(LocalDateTime.now())
                                .build();
                        return attendanceRepository.save(attendance);
                    });

            return ResponseEntity.ok(new AuthResponse(token, mustReset));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Incorrect username or password");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(@AuthenticationPrincipal User user) {
        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(user.getId(), today)
                .orElseThrow(() -> new RuntimeException("No check-in found for today."));

        if (attendance.getCheckOut() == null) {
            attendance.setCheckOut(LocalDateTime.now());
            attendanceRepository.save(attendance);
        }

        return ResponseEntity.ok("Logged out and checked-out successfully!");
    }

    // ✅ New: Forgot Password endpoint
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody String username) {
        Optional<User> maybeUser = userRepository.findByUsername(username);
        if (maybeUser.isEmpty()) {
            return ResponseEntity.ok("If a matching account is found, a password reset email will be sent.");
        }
        User user = maybeUser.get();

        String token = passwordResetTokenService.generateToken(user.getUsername());
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        try {
            emailService.sendPasswordResetEmail(user.getUsername(), token);
        } catch (MessagingException e) {
            return ResponseEntity.internalServerError().body("Failed to send password reset email.");
        }
        return ResponseEntity.ok("If a matching account is found, a password reset email will be sent.");
    }

    // ✅ New: Reset Password endpoint
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody PasswordResetRequest request) {
        Optional<User> maybeUser = userRepository.findByResetToken(request.getToken());
        if (maybeUser.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid or expired password reset token.");
        }
        User user = maybeUser.get();

        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Invalid or expired password reset token.");
        }

        if (!PasswordValidator.isValid(request.getNewPassword())) {
            return ResponseEntity.badRequest().body("Password does not meet complexity requirements.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setFirstLogin(false);
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok("Password has been reset successfully.");
    }

    // ✅ New: Refresh Token endpoint
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequest request) {
        String username = refreshTokenService.validateRefreshToken(request.getRefreshToken());
        if (username == null) {
            return ResponseEntity.badRequest().body("Invalid refresh token.");
        }

        UserDetails userDetails = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newToken = jwtUtil.generateToken(userDetails);
        return ResponseEntity.ok(new AuthResponse(newToken, false));
    }
}