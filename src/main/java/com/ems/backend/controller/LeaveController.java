package com.ems.backend.controller;

import com.ems.backend.entity.*;
import com.ems.backend.repository.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leave")
public class LeaveController {

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @PostMapping("/request")
    public String requestLeave(@AuthenticationPrincipal UserDetails userDetails, @RequestBody LeaveRequest leaveRequest) {
        leaveRequest.setEmployeeId(((User) userDetails).getId());
        leaveRequest.setStatus(LeaveStatus.PENDING);
        leaveRequestRepository.save(leaveRequest);
        return "Leave requested successfully!";
    }
    @GetMapping("/my-requests")
    public List<LeaveRequest> getMyLeaveRequests(@AuthenticationPrincipal User user) {
        return leaveRequestRepository.findByEmployeeId(user.getId()); // <-- CORRECTED
    }
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/pending")
    public List<LeaveRequest> viewPendingLeaves() {
        return leaveRequestRepository.findByStatus(LeaveStatus.PENDING);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/approve/{id}")
    public String approveLeave(@PathVariable Long id) {
        LeaveRequest leave = leaveRequestRepository.findById(id).orElseThrow();
        leave.setStatus(LeaveStatus.APPROVED);
        leaveRequestRepository.save(leave);
        return "Leave approved.";
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/reject/{id}")
    public String rejectLeave(@PathVariable Long id) {
        LeaveRequest leave = leaveRequestRepository.findById(id).orElseThrow();
        leave.setStatus(LeaveStatus.REJECTED);
        leaveRequestRepository.save(leave);
        return "Leave rejected.";
    }
}
