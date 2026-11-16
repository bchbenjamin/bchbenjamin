package in.bchbenjamin.portfolio.agent;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import in.bchbenjamin.portfolio.admin.AdminAuditService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/agent-proposals")
public class AdminAgentProposalController {
    private final AgentProposalService proposals;
    private final AdminAuditService audit;

    public AdminAgentProposalController(AgentProposalService proposals, AdminAuditService audit) { this.proposals = proposals; this.audit = audit; }

    @GetMapping
    public List<Map<String, Object>> list() { return proposals.list(); }

    @PostMapping("/{id}/approve")
    public Map<String, Object> approve(@PathVariable UUID id, @RequestBody(required = false) ReviewRequest request,
                                       @AuthenticationPrincipal OidcUser actor) {
        Map<String, Object> result = proposals.review(id, true, actor.getName(), request == null ? "" : request.note());
        audit.record(actor, "APPROVE_AGENT_PROPOSAL", "agent-proposal", id);
        return result;
    }

    @PostMapping("/{id}/reject")
    public Map<String, Object> reject(@PathVariable UUID id, @RequestBody(required = false) ReviewRequest request,
                                      @AuthenticationPrincipal OidcUser actor) {
        Map<String, Object> result = proposals.review(id, false, actor.getName(), request == null ? "" : request.note());
        audit.record(actor, "REJECT_AGENT_PROPOSAL", "agent-proposal", id);
        return result;
    }

    public record ReviewRequest(String note) { }
}
