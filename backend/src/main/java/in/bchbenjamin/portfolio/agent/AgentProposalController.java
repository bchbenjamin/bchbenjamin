package in.bchbenjamin.portfolio.agent;

import java.util.Map;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/agent/proposals")
public class AgentProposalController {
    private final AgentProposalService proposals;

    public AgentProposalController(AgentProposalService proposals) { this.proposals = proposals; }

    @PostMapping
    @PreAuthorize("hasAuthority('SCOPE_portfolio:propose')")
    public Map<String, Object> create(@RequestBody ProposalRequest request, Authentication authentication) {
        return proposals.create(request.resource(), request.operation(), request.targetId(), request.payload(), authentication.getName());
    }

    public record ProposalRequest(String resource, String operation, UUID targetId, Map<String, Object> payload) { }
}
