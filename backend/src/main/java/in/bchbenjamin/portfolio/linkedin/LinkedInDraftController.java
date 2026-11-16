package in.bchbenjamin.portfolio.linkedin;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import in.bchbenjamin.portfolio.admin.AdminAuditService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/admin/linkedin")
public class LinkedInDraftController {
    private final LinkedInPublishingService publishing;
    private final AdminAuditService audit;

    public LinkedInDraftController(LinkedInPublishingService publishing, AdminAuditService audit) {
        this.publishing = publishing;
        this.audit = audit;
    }

    @GetMapping("/connection")
    public Map<String, Object> connection(@AuthenticationPrincipal OidcUser actor) {
        return publishing.connectionStatus(actor);
    }

    @GetMapping("/drafts")
    public List<Map<String, Object>> drafts() {
        return publishing.drafts();
    }

    @PostMapping("/drafts")
    public Map<String, Object> create(@RequestBody Map<String, String> body, @AuthenticationPrincipal OidcUser actor) {
        try {
            Map<String, Object> draft = publishing.createDraft(body.get("content"), actor);
            audit.record(actor, "CREATE_DRAFT", "linkedin-draft", UUID.fromString(draft.get("id").toString()));
            return draft;
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    @PostMapping("/drafts/{id}/approve")
    public Map<String, Object> approve(@PathVariable UUID id, @AuthenticationPrincipal OidcUser actor) {
        return review(id, true, actor);
    }

    @PostMapping("/drafts/{id}/reject")
    public Map<String, Object> reject(@PathVariable UUID id, @AuthenticationPrincipal OidcUser actor) {
        return review(id, false, actor);
    }

    @PostMapping("/drafts/{id}/publish")
    public Map<String, Object> publish(@PathVariable UUID id, @AuthenticationPrincipal OidcUser actor) {
        try {
            Map<String, Object> result = publishing.publish(id, actor);
            audit.record(actor, "PUBLISH_LINKEDIN_DRAFT", "linkedin-draft", id);
            return result;
        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, exception.getMessage());
        }
    }

    private Map<String, Object> review(UUID id, boolean approve, OidcUser actor) {
        try {
            Map<String, Object> result = publishing.review(id, approve, actor);
            audit.record(actor, approve ? "APPROVE_LINKEDIN_DRAFT" : "REJECT_LINKEDIN_DRAFT", "linkedin-draft", id);
            return result;
        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, exception.getMessage());
        }
    }
}
