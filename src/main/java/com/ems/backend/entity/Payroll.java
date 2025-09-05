package com.ems.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "payroll")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payroll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long employeeId;

    private int month;
    private int year;

    private double salary;
}
