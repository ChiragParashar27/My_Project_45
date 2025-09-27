package com.ems.backend.controller;

import com.ems.backend.entity.Payroll;
import com.ems.backend.entity.User;
import com.ems.backend.service.PayrollService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollService payrollService;

    public PayrollController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    // Admin creates payroll
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/create")
    public Payroll createPayroll(@RequestBody Payroll payroll) {
        return payrollService.createPayroll(payroll);
    }

    // Employee views own payrolls
    @GetMapping("/my-salary")
    public List<Payroll> getMyPayrolls(@AuthenticationPrincipal User user) {
        return payrollService.getPayrollsForEmployee(user.getId());
    }

    // Admin views all payrolls
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public List<Payroll> getAllPayrolls() {
        return payrollService.getAllPayrolls();
    }

    // ✅ Download Salary Slip
    @GetMapping("/slip/{payrollId}")
    public ResponseEntity<byte[]> downloadSalarySlip(@PathVariable Long payrollId) throws IOException {
        byte[] pdf = payrollService.generateSalarySlip(payrollId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=salary=slip.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
