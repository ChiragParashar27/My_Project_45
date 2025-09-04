package com.ems.backend.dto;

public class AuthResponse {

    private String token;

    // Default constructor
    public AuthResponse() {
    }

    // Constructor with token
    public AuthResponse(String token) {
        this.token = token;
    }

    // Getter
    public String getToken() {
        return token;
    }

    // Setter
    public void setToken(String token) {
        this.token = token;
    }
}
