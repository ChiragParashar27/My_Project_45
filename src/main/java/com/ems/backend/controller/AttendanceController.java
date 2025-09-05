package com.ems.backend.controller;

import com.ems.backend.entity.Attendance;
import com.ems.backend.entity.User;
import com.ems.backend.repository.AttendanceRepository;
import com.ems.backend.auth.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @PostMapping("/check-in")
    public String checkIn(@AuthenticationPrincipal UserDetails userDetails) {
        Long employeeId = ((com.ems.backend.entity.User) userDetails).getId();
        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .orElse(Attendance.builder()
                        .employeeId(employeeId)
                        .date(today)
                        .build());

        if (attendance.getCheckIn() != null) {
            return "Already checked in today!";
        }

        attendance.setCheckIn(LocalDateTime.now());
        attendanceRepository.save(attendance);
        return "Check-in successful!";
    }

    @PostMapping("/check-out")
    public String checkOut(@AuthenticationPrincipal UserDetails userDetails) {
        Long employeeId = ((com.ems.backend.entity.User) userDetails).getId();
        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .orElseThrow(() -> new RuntimeException("No check-in found for today."));

        if (attendance.getCheckOut() != null) {
            return "Already checked out today!";
        }

        attendance.setCheckOut(LocalDateTime.now());
        attendanceRepository.save(attendance);
        return "Check-out successful!";
    }
    @GetMapping("/me")
    public List<Attendance> getAttendanceHistory(@AuthenticationPrincipal User user) { // <-- ADDED
        return attendanceRepository.findByEmployeeId(user.getId());
        }
}
