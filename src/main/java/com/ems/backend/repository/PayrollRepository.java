// src/main/java/com/ems/backend/repository/PayrollRepository.java
package com.ems.backend.repository;

import com.ems.backend.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    List<Payroll> findByEmployeeId(Long employeeId);
    List<Payroll> findBySalaryMonth(LocalDate month);
}
