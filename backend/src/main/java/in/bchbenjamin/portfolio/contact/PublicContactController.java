package in.bchbenjamin.portfolio.contact;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestController
@RequestMapping("/api/v1/public/contact")
public class PublicContactController {
    private final ContactSubmissionService submissions;
    public PublicContactController(ContactSubmissionService submissions) { this.submissions = submissions; }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, Object> submit(@Valid @RequestBody ContactRequest request, HttpServletRequest servletRequest) {
        var result = submissions.submit(request, servletRequest.getRemoteAddr(), servletRequest.getHeader("User-Agent"));
        return Map.of("status", result.status(), "message", "If this submission is eligible, an email verification link will be sent.");
    }

    @PostMapping("/verify")
    public Map<String, Object> verify(@RequestParam String token) {
        var result = submissions.verify(token);
        String message = switch (result.status()) {
            case "NOTIFIED" -> "Your email is verified and the message has been delivered to the portfolio owner.";
            case "DELIVERY_FAILED" -> "Your email is verified, but notification delivery failed. The owner can retry delivery.";
            default -> "Your email is verified. The submission is awaiting owner review.";
        };
        return Map.of("status", result.status(), "message", message);
    }
}
