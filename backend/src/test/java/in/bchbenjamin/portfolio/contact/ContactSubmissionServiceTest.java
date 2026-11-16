package in.bchbenjamin.portfolio.contact;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class ContactSubmissionServiceTest {
    @Test
    void honeypotSubmissionIsSilentlyDiscarded() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        ContactModerationService moderation = mock(ContactModerationService.class);
        ContactMailService mail = mock(ContactMailService.class);
        var service = new ContactSubmissionService(jdbc, moderation, mail, "test-salt");
        var request = new ContactRequest("Bot", null, "bot@example.com", "Spam",
            "This is an automated message that should be discarded.", "https://spam.invalid");
        var result = service.submit(request, "192.0.2.10", "bot");
        assertEquals("accepted", result.status());
        verifyNoInteractions(jdbc, moderation, mail);
    }
}
