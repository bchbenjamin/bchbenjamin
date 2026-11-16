package in.bchbenjamin.portfolio.admin;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Service
public class AdminAuditService {
    private final JdbcTemplate jdbc;

    public AdminAuditService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void record(OidcUser actor, String action, String resource, UUID resourceId) {
        jdbc.update("""
            INSERT INTO admin_audit_log (actor_issuer, actor_subject, action, resource, resource_id)
            VALUES (?, ?, ?, ?, ?)
            """, actor.getIssuer().toString(), actor.getSubject(), action, resource, resourceId);
    }
}
