package com.ems.backend.controller;

import com.ems.backend.entity.Attendance;
import com.ems.backend.entity.User;
import com.ems.backend.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @PostMapping("/check-in")
    public String checkIn(@AuthenticationPrincipal User user) {
        LocalDate today = LocalDate.now();

        Optional<Attendance> attendanceToday = attendanceRepository.findByEmployeeIdAndDate(user.getId(), today);
        if (attendanceToday.isPresent()) {
            return "Already checked in today!";
        }

        Attendance attendance = Attendance.builder()
                .employeeId(user.getId())
                .date(today)
                .checkIn(LocalDateTime.now())
                .build();

        attendanceRepository.save(attendance);
        return "Check-in successful!";
    }

    @PostMapping("/check-out")
    public String checkOut(@AuthenticationPrincipal User user) {
        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(user.getId(), today)
                .orElseThrow(() -> new RuntimeException("No check-in found for today."));

        if (attendance.getCheckOut() != null) {
            return "Already checked out today!";
        }

        attendance.setCheckOut(LocalDateTime.now());
        attendanceRepository.save(attendance);
        return "Check-out successful!";
    }

    @GetMapping("/history")
    public List<Attendance> getAttendanceHistory(@AuthenticationPrincipal User user) {
        return attendanceRepository.findByEmployeeId(user.getId());
    }
}