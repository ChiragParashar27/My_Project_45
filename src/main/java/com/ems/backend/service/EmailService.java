// src/main/java/com/ems.backend/service/EmailService.java

package com.ems.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.scheduling.annotation.Async;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ✅ Asynchronous email sending methods
    @Async
    public void sendRegistrationPendingEmail(String toEmail, String name) throws MessagingException {
        sendPlainEmail(toEmail,
                "EMS: Registration Pending Approval",
                "Dear " + name + ",\n\nYour registration is received. Your account is pending approval by the administrator. " +
                        "You will be notified once approved.\n\nRegards,\nEMS Team");
    }

    @Async
    public void sendCredentialsEmail(String toEmail, String plainPassword) throws MessagingException {
        sendPlainEmail(toEmail,
                "EMS: Your Account Credentials",
                "Here are your credentials:\n\nUsername: " + toEmail + "\nPassword: " + plainPassword +
                        "\n\nPlease login and change your password immediately.");
    }

    @Async
    public void sendAccountApprovalEmail(String toEmail, String name) throws MessagingException {
        sendPlainEmail(toEmail,
                "EMS: Account Approved",
                "Dear " + name + ",\n\nYour account has been approved. You can now log in to EMS.\n\nRegards,\nEMS Team");
    }

    @Async
    public void sendLeaveApprovalEmail(String toEmail, String name, String startDate, String endDate) throws MessagingException {
        sendPlainEmail(toEmail,
                "Leave Request Approved",
                "Dear " + name + ",\n\nYour leave request from " + startDate + " to " + endDate +
                        " has been approved.\n\nBest regards,\nThe EMS Team");
    }

    @Async
    public void sendLeaveRejectionEmail(String toEmail, String name, String startDate, String endDate) throws MessagingException {
        sendPlainEmail(toEmail,
                "Leave Request Rejected",
                "Dear " + name + ",\n\nWe regret to inform you that your leave request from " + startDate +
                        " to " + endDate + " has been rejected.\n\nBest regards,\nThe EMS Team");
    }

    @Async
    public void sendLeaveApplicationEmailToAdmin(String adminEmail, String employeeName, String type, String startDate, String endDate) throws MessagingException {
        sendPlainEmail(adminEmail,
                "New Leave Application",
                "Employee " + employeeName + " has applied for leave (" + type + ") " +
                        "from " + startDate + " to " + endDate + ".");
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String token) throws MessagingException {
        String resetLink = "http://localhost:3000/reset-password?token=" + token;
        sendPlainEmail(toEmail,
                "Password Reset Request",
                "To reset your password, please click the link below:\n\n" + resetLink + "\n\n" +
                        "This link is valid for 15 minutes.\n\nRegards,\nEMS Team");
    }

    private void sendPlainEmail(String toEmail, String subject, String body) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(body, false);
        mailSender.send(message);
    }
}