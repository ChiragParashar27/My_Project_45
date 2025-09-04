package com.ems.backend.controller.test;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/employee")
    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN')")
    public String employeeAccess() {
        return "This content is for EMPLOYEES and ADMINS.";
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminAccess() {
        return "This content is for ADMINS only.";
    }
}
