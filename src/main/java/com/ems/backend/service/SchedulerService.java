// src/main/java/com/ems/backend/service/SchedulerService.java

package com.ems.backend.service;

import com.ems.backend.entity.User;
import com.ems.backend.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.List;
import java.time.LocalDate;

@Service
public class SchedulerService {

    private final UserRepository userRepository;
    private final PayrollService payrollService;

    public SchedulerService(UserRepository userRepository, PayrollService payrollService) {
        this.userRepository = userRepository;
        this.payrollService = payrollService;
    }

    // ✅ New: Scheduled job to generate monthly payroll
    @Scheduled(cron = "0 0 0 1 * ?") // Runs at 12:00 AM on the 1st day of every month
    public void generateMonthlyPayroll() {
        System.out.println("Starting monthly payroll generation...");
        List<User> employees = userRepository.findAll();
        for (User employee : employees) {
            // Logic to calculate monthly payroll for each employee
            // This is a placeholder; real-life logic would be more complex
            if (employee.getRole().equals(com.ems.backend.entity.Role.EMPLOYEE)) {
                try {
                    // Create a dummy payroll for demonstration
                    com.ems.backend.entity.Payroll payroll = new com.ems.backend.entity.Payroll();
                    payroll.setEmployeeId(employee.getId());
                    payroll.setSalaryMonth(LocalDate.now().minusMonths(1).withDayOfMonth(1));
                    payroll.setBasicSalary(50000);
                    payroll.setAllowances(5000);
                    payroll.setDeductions(2000);
                    payrollService.createPayroll(payroll);
                    System.out.println("Generated payroll for " + employee.getName());
                } catch (Exception e) {
                    System.err.println("Failed to generate payroll for " + employee.getName());
                }
            }
        }
        System.out.println("Monthly payroll generation completed.");
    }
}