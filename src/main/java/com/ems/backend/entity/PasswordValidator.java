package com.ems.backend.entity;
public class PasswordValidator {

    public static boolean isValid(String password) {
        if (password == null) return false;

        return password.length() >= 8 &&
                password.matches(".*[A-Z].*") &&       // at least one uppercase
                password.matches(".*[a-z].*") &&       // at least one lowercase
                password.matches(".*\\d.*") &&         // at least one digit
                password.matches(".*[@$!%*?&].*");     // at least one special char
    }
}
