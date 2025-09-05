package com.ems.backend.controller;

import com.ems.backend.entity.Payroll;
import com.ems.backend.entity.User;
import com.ems.backend.repository.PayrollRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.font.PDType1Font;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    @Autowired
    private PayrollRepository payrollRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/add")
    public String addPayroll(@RequestBody Payroll payroll) {
        payrollRepository.save(payroll);
        return "Payroll added successfully!";
    }

    @GetMapping("/payslip")
    public ResponseEntity<byte[]> getPayslip(@AuthenticationPrincipal User user,
                                             @RequestParam int month,
                                             @RequestParam int year) throws Exception {
        Payroll payroll = payrollRepository.findByEmployeeIdAndMonthAndYear(user.getId(), month, year)
                .orElseThrow(() -> new RuntimeException("Payroll not found"));

        // Generate PDF using PDFBox
        PDDocument document = new PDDocument();
        PDPage page = new PDPage();
        document.addPage(page);

        PDPageContentStream contentStream = new PDPageContentStream(document, page);
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 20);
        contentStream.beginText();
        contentStream.newLineAtOffset(50, 700);
        contentStream.showText("Payslip for " + user.getName());
        contentStream.newLineAtOffset(0, -30);
        contentStream.showText("Month: " + month + "/" + year);
        contentStream.newLineAtOffset(0, -20);
        contentStream.showText("Salary: $" + payroll.getSalary());
        contentStream.endText();
        contentStream.close();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        document.save(baos);
        document.close();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payslip.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(baos.toByteArray());
    }
}
