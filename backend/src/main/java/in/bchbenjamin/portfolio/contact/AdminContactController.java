package in.bchbenjamin.portfolio.contact;

import jakarta.validation.Valid;
import in.bchbenjamin.portfolio.admin.AdminAuditService;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/contact")
public class AdminContactController {
    private final ContactSubmissionService submissions;
    private final AdminAuditService audit;
    public AdminContactController(ContactSubmissionService submissions, AdminAuditService audit) {
        this.submissions = submissions;
        this.audit = audit;
    }
    @GetMapping public List<Map<String, Object>> list() { return submissions.list(); }
    @PostMapping("/{id}/review")
    public Map<String, Object> review(@PathVariable UUID id, @Valid @RequestBody ReviewRequest request,
        @AuthenticationPrincipal OidcUser actor) {
        Map<String, Object> result = submissions.review(id, request.approve(), request.note(), actor.getName());
        audit.record(actor, request.approve() ? "APPROVE" : "REJECT", "contact", id);
        return result;
    }
    @PostMapping("/{id}/retry")
    public Map<String, Object> retry(@PathVariable UUID id, @AuthenticationPrincipal OidcUser actor) {
        Map<String, Object> result = submissions.retryDelivery(id);
        audit.record(actor, "RETRY_DELIVERY", "contact", id);
        return result;
    }
    @PostMapping("/{id}/resend-verification")
    public Map<String, Object> resendVerification(@PathVariable UUID id, @AuthenticationPrincipal OidcUser actor) {
        Map<String, Object> result = submissions.resendVerification(id);
        audit.record(actor, "RESEND_VERIFICATION", "contact", id);
        return result;
    }
    public record ReviewRequest(boolean approve, @Size(max = 500) String note) { }
}
