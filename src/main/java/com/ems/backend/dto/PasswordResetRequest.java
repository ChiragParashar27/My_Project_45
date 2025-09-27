// src/main/java/com/ems/backend/dto/PasswordResetRequest.java
package com.ems.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetRequest {
    private String token;
    private String newPassword;
}