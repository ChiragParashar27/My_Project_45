package com.ems.backend.bootstrap;

import com.ems.backend.entity.Role;
import com.ems.backend.entity.User;
import com.ems.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataLoader(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername("admin@ems.com").isEmpty()) {
            User admin = new User();
            admin.setName("System Admin");
            admin.setUsername("admin@ems.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            admin.setApproved(true);
            admin.setFirstLogin(false);
            admin.setContactNumber("1234567890");
            admin.setDateOfJoining(LocalDate.now()); // ✅ Add this line
            userRepository.save(admin);
            System.out.println("Created default admin: admin@ems.com / admin123");
        }
    }
}