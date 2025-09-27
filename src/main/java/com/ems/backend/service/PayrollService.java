package com.ems.backend.service;

import com.ems.backend.entity.Payroll;
import com.ems.backend.entity.User;
import com.ems.backend.repository.PayrollRepository;
import com.ems.backend.repository.UserRepository;
import com.ems.backend.repository.LeaveRequestRepository;
import com.ems.backend.entity.LeaveStatus;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final UserRepository userRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    public PayrollService(PayrollRepository payrollRepository,
                          UserRepository userRepository,
                          LeaveRequestRepository leaveRequestRepository) {
        this.payrollRepository = payrollRepository;
        this.userRepository = userRepository;
        this.leaveRequestRepository = leaveRequestRepository;
    }

    public Payroll createPayroll(Payroll payroll) {
        double netSalary = payroll.getBasicSalary() + payroll.getAllowances() - payroll.getDeductions();
        payroll.setNetSalary(netSalary);
        return payrollRepository.save(payroll);
    }

    public List<Payroll> getPayrollsForEmployee(Long employeeId) {
        return payrollRepository.findByEmployeeId(employeeId);
    }

    public List<Payroll> getAllPayrolls() {
        return payrollRepository.findAll();
    }

    // ✅ Generate Salary Slip PDF with Employee Name & Leave Balance
    public byte[] generateSalarySlip(Long payrollId) throws IOException {
        Payroll payroll = payrollRepository.findById(payrollId)
                .orElseThrow(() -> new RuntimeException("Payroll not found"));

        // Fetch employee info
        User employee = userRepository.findById(payroll.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Count approved leaves for current year
        long leavesTaken = leaveRequestRepository.findByEmployeeId(employee.getId()).stream()
                .filter(l -> l.getStatus() == LeaveStatus.APPROVED)
                .count();

        int totalLeaveQuota = 20; // Example: 20 leaves allowed per year
        long leaveBalance = totalLeaveQuota - leavesTaken;

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            PDPage page = new PDPage();
            document.addPage(page);

            PDPageContentStream contentStream = new PDPageContentStream(document, page);

            // Title
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 18);
            contentStream.beginText();
            contentStream.newLineAtOffset(200, 750);
            contentStream.showText("Salary Slip");
            contentStream.endText();

            // Employee details
            contentStream.setFont(PDType1Font.HELVETICA, 12);
            contentStream.beginText();
            contentStream.newLineAtOffset(50, 700);
            contentStream.showText("Employee Name: " + employee.getName());
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Employee ID: " + employee.getId());
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Salary Month: " + payroll.getSalaryMonth());
            contentStream.endText();

            // Salary details
            contentStream.beginText();
            contentStream.newLineAtOffset(50, 630);
            contentStream.showText("Basic Salary: " + payroll.getBasicSalary());
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Allowances: " + payroll.getAllowances());
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Deductions: " + payroll.getDeductions());
            contentStream.newLineAtOffset(0, -20);
            contentStream.showText("Net Salary: " + payroll.getNetSalary());
            contentStream.endText();

            // Leave balance
            contentStream.beginText();
            contentStream.newLineAtOffset(50, 540);
            contentStream.showText("Leave Balance: " + leaveBalance + " days");
            contentStream.endText();

            contentStream.close();
            document.save(out);
            return out.toByteArray();
        }
    }
}