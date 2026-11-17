package in.bchbenjamin.portfolio.admin;

import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/site-configuration")
public class AdminSiteConfigurationController {
    private final JdbcTemplate jdbc;
    private final AdminAuditService audit;
    public AdminSiteConfigurationController(JdbcTemplate jdbc, AdminAuditService audit) { this.jdbc = jdbc; this.audit = audit; }

    @GetMapping
    public Map<String, Object> get() {
        return jdbc.query("SELECT draft_config::text AS draft_config, published_config::text AS published_config, updated_at, published_at FROM site_configuration WHERE id = 1", rs -> {
            if (!rs.next()) return Map.of();
            return Map.of("draftConfig", rs.getString("draft_config"), "publishedConfig", rs.getString("published_config"),
                "updatedAt", rs.getTimestamp("updated_at"), "publishedAt", rs.getTimestamp("published_at") == null ? "" : rs.getTimestamp("published_at"));
        });
    }

    @PutMapping
    public Map<String, Object> saveDraft(@RequestBody Map<String, Object> config, @AuthenticationPrincipal OidcUser actor) {
        jdbc.update("UPDATE site_configuration SET draft_config = ?::jsonb, updated_at = now() WHERE id = 1", write(config));
        audit.record(actor, "UPDATE", "site-configuration", null);
        return get();
    }

    @PostMapping("/publish")
    public Map<String, Object> publish(@AuthenticationPrincipal OidcUser actor) {
        jdbc.update("UPDATE site_configuration SET published_config = draft_config, published_at = now(), updated_at = now() WHERE id = 1");
        audit.record(actor, "PUBLISH", "site-configuration", null);
        return get();
    }

    private static String write(Map<String, Object> config) {
        try { return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(config); }
        catch (Exception ex) { throw new IllegalArgumentException("Invalid site configuration", ex); }
    }
}
