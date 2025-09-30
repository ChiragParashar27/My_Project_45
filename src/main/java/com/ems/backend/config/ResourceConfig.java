package com.ems.backend.config;
// src/main/java/com/ems/backend/config/ResourceConfig.java

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map the public URL path '/uploads/**' to the local file system directory 'uploads/'
        // NOTE: The 'file:' prefix is critical.
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");

        // Ensure the path matches where EmployeeController saves files:
        // String uploadDir = "uploads/profile-pictures/";
        // If files are saved to 'uploads/profile-pictures/', the location should be adjusted:
        // registry.addResourceHandler("/uploads/profile-pictures/**")
        //         .addResourceLocations("file:uploads/profile-pictures/");
    }
}
