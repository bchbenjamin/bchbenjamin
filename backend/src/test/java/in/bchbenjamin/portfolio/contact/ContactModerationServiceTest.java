package in.bchbenjamin.portfolio.contact;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;
import static org.junit.jupiter.api.Assertions.assertEquals;

class ContactModerationServiceTest {
    @Test
    void missingAiConfigurationFailsClosedToOwnerReview() {
        var service = new ContactModerationService(RestClient.builder(), new ObjectMapper(), "", "", "", "/v1/chat/completions");
        var request = new ContactRequest("Alex Example", "Example Labs", "alex@example.com", "Collaboration",
            "I would like to discuss a software engineering collaboration.", "");
        var assessment = service.assess(request);
        assertEquals("REVIEW", assessment.decision());
        assertEquals(50, assessment.riskScore());
    }
}
