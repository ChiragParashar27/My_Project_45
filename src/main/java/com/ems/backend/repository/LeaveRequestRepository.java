package com.ems.backend.repository;

import com.ems.backend.entity.LeaveRequest;
import com.ems.backend.entity.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByStatus(LeaveStatus status);
    List<LeaveRequest> findByEmployeeId(Long employeeId);
}
