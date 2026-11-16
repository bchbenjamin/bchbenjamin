package in.bchbenjamin.portfolio.contact;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ContactMailServiceTest {
    @Test
    void inboxNotificationUsesVisitorAsReplyToAndAuthenticatedMailboxAsFrom() throws Exception {
        JavaMailSender sender = mock(JavaMailSender.class);
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(sender.createMimeMessage()).thenReturn(message);
        var service = new ContactMailService(sender, "alternate.sender@gmail.com", "primary.inbox@gmail.com", "", "https://bchbenjamin.in");
        service.sendInboxNotification(new ContactMailService.ContactMessage(UUID.randomUUID(), "Alex Example",
            "Example Labs", "alex@example.com", "Collaboration", "A real enquiry with sufficient context.",
            "APPROVE", 4, "Plausible but not identity-verified", "Relevant professional enquiry"));
        verify(sender).send(message);
        assertEquals("alternate.sender@gmail.com", message.getFrom()[0].toString());
        assertEquals("alex@example.com", message.getReplyTo()[0].toString());
        assertEquals("primary.inbox@gmail.com", message.getAllRecipients()[0].toString());
    }
}
