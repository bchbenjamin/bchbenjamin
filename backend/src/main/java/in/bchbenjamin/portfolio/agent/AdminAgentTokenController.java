package in.bchbenjamin.portfolio.agent;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import in.bchbenjamin.portfolio.admin.AdminAuditService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/admin/agent-tokens")
public class AdminAgentTokenController {
    private final AgentTokenService tokens;
    private final AdminAuditService audit;

    public AdminAgentTokenController(AgentTokenService tokens, AdminAuditService audit) { this.tokens = tokens; this.audit = audit; }

    @GetMapping
    public List<Map<String, Object>> list() { return tokens.list(); }

    @PostMapping
    public AgentTokenService.CreatedToken create(@RequestBody CreateRequest request, @AuthenticationPrincipal OidcUser actor) {
        try {
            var created = tokens.create(request.name(), request.scopes(), request.expiresInDays(), actor.getName());
            audit.record(actor, "CREATE_AGENT_TOKEN", "agent-token", created.id());
            return created;
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public void revoke(@PathVariable UUID id, @AuthenticationPrincipal OidcUser actor) {
        try {
            tokens.revoke(id);
            audit.record(actor, "REVOKE_AGENT_TOKEN", "agent-token", id);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
        }
    }

    public record CreateRequest(String name, Set<String> scopes, Integer expiresInDays) { }
}
