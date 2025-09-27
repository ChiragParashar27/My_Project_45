// src/main/java/com/ems/backend/repository/UserRepository.java
package com.ems.backend.repository;

import com.ems.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    Optional<User> findByResetToken(String resetToken); // ✅ New method
}