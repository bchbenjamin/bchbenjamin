package in.bchbenjamin.portfolio.contact;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class ContactMailService {
    private final JavaMailSender mailSender;
    private final String from;
    private final String inbox;
    private final String cc;
    private final String frontendUrl;

    public ContactMailService(JavaMailSender mailSender,
        @Value("${app.contact.smtp-from:}") String from,
        @Value("${app.contact.inbox:}") String inbox,
        @Value("${app.contact.notification-cc:}") String cc,
        @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.mailSender = mailSender;
        this.from = from;
        this.inbox = inbox;
        this.cc = cc;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    public void sendVerification(String to, String name, String token) {
        requireConfigured();
        String link = frontendUrl + "/contact/verify?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setFrom(from);
        mail.setTo(to);
        mail.setSubject("Confirm your message to Benjamin");
        mail.setText("Hi " + name + ",\n\nPlease confirm that this email address belongs to you by opening the link below.\n\n"
            + link + "\n\nThe link expires in 24 hours. If you did not submit the contact form, ignore this message.");
        mailSender.send(mail);
    }

    public void sendInboxNotification(ContactMessage message) {
        requireConfigured();
        try {
            var mime = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(mime, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(inbox);
            helper.setReplyTo(message.email());
            if (cc != null && !cc.isBlank()) helper.setCc(cc);
            helper.setSubject("Portfolio enquiry: " + message.subject());
            helper.setText("A contact submission passed email verification and moderation.\n\n"
                + "Name: " + message.name() + "\nOrganisation: " + nullSafe(message.organization())
                + "\nEmail: " + message.email() + "\nSubject: " + message.subject()
                + "\nReceived: " + OffsetDateTime.now() + "\nSubmission ID: " + message.id()
                + "\nAI assessment: " + message.aiDecision() + " (risk " + message.riskScore() + "/100)"
                + "\nIdentity note: " + message.identityAssessment() + "\nScreening: " + message.aiReason()
                + "\n\nMessage:\n" + message.body()
                + "\n\nReply directly to this email to respond to the sender. The Reply-To header is set to their verified address.", false);
            mailSender.send(mime);
        } catch (Exception exception) {
            throw new IllegalStateException("Notification delivery failed", exception);
        }
    }

    private void requireConfigured() {
        if (from == null || from.isBlank() || inbox == null || inbox.isBlank())
            throw new IllegalStateException("Contact SMTP sender and inbox are not configured");
    }
    private static String nullSafe(String value) { return value == null ? "Not supplied" : value; }

    public record ContactMessage(java.util.UUID id, String name, String organization, String email,
        String subject, String body, String aiDecision, int riskScore, String identityAssessment, String aiReason) { }
}
