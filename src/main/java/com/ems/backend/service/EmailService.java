// src/main/java/com/ems/backend/service/EmailService.java

package com.ems.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendRegistrationEmail(String toEmail, String name) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(toEmail);
        helper.setSubject("Welcome to the Employee Management System!");
        helper.setText("Dear " + name + ",\n\n"
                + "You have been successfully registered in the Employee Management System.\n\n"
                + "You can now log in using your provided username and password.\n\n"
                + "Best regards,\n"
                + "The EMS Team, \n"
                +" also welcome in Chirag's Project", true);

        mailSender.send(message);
    }
}