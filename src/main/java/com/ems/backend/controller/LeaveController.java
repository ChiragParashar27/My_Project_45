package com.ems.backend.controller;

import com.ems.backend.entity.*;
import com.ems.backend.repository.LeaveRequestRepository;
import com.ems.backend.repository.UserRepository;
import com.ems.backend.service.EmailService;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    @Autowired
    private LeaveRequestRepository leaveRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Value("${ems.admin.email}")
    private String adminEmail;

    // 🔹 Apply for Leave
    @PostMapping("/apply")
    public String applyLeave(@AuthenticationPrincipal User user, @RequestBody LeaveRequest leave) {
        leave.setEmployeeId(user.getId());
        leave.setStatus(LeaveStatus.PENDING);
        leave.setAppliedOn(LocalDateTime.now());
        leaveRepository.save(leave);

        try {
            // Notify Admin
            emailService.sendLeaveApplicationEmailToAdmin(
                    adminEmail,
                    user.getName(),
                    leave.getType().name(),
                    leave.getStartDate().toString(),
                    leave.getEndDate().toString()
            );
        } catch (MessagingException e) {
            System.err.println("Failed to send leave application email to admin.");
        }

        return "Leave application submitted successfully!";
    }

    // 🔹 View My Leaves
    @GetMapping("/my-leaves")
    public List<LeaveRequest> getMyLeaves(@AuthenticationPrincipal User user) {
        return leaveRepository.findByEmployeeId(user.getId());
    }

    // 🔹 Admin/Manager: Approve Leave
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')") // ✅ Updated to allow managers
    @PostMapping("/approve/{leaveId}")
    public String approveLeave(@PathVariable Long leaveId) {
        LeaveRequest leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave not found"));
        leave.setStatus(LeaveStatus.APPROVED);
        leaveRepository.save(leave);

        // Notify Employee
        userRepository.findById(leave.getEmployeeId()).ifPresent(emp -> {
            try {
                emailService.sendLeaveApprovalEmail(
                        emp.getUsername(),
                        emp.getName(),
                        leave.getStartDate().toString(),
                        leave.getEndDate().toString()
                );
            } catch (MessagingException e) {
                System.err.println("Failed to send approval email to " + emp.getUsername());
            }
        });

        return "Leave approved successfully!";
    }

    // 🔹 Admin/Manager: Reject Leave
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')") // ✅ Updated to allow managers
    @PostMapping("/reject/{leaveId}")
    public String rejectLeave(@PathVariable Long leaveId) {
        LeaveRequest leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave not found"));
        leave.setStatus(LeaveStatus.REJECTED);
        leaveRepository.save(leave);

        // Notify Employee
        userRepository.findById(leave.getEmployeeId()).ifPresent(emp -> {
            try {
                emailService.sendLeaveRejectionEmail(
                        emp.getUsername(),
                        emp.getName(),
                        leave.getStartDate().toString(),
                        leave.getEndDate().toString()
                );
            } catch (MessagingException e) {
                System.err.println("Failed to send rejection email to " + emp.getUsername());
            }
        });

        return "Leave rejected successfully!";
    }

    // 🔹 Admin: View All Leaves
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public List<LeaveRequest> getAllLeaves() {
        return leaveRepository.findAll();
    }
}