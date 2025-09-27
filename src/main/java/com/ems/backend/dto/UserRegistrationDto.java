// src/main/java/com/ems/backend/dto/UserRegistrationDto.java
package com.ems.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UserRegistrationDto {
    private String name;
    private String username;   // email
    private String password;
    private String contactNumber;
    private String department;
    private String designation;
    private LocalDate dateOfJoining;
    private String role; // "EMPLOYEE" or "ADMIN"
}
