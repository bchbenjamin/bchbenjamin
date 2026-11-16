package in.bchbenjamin.portfolio.admin;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/audit")
public class AdminAuditController {
    private final JdbcTemplate jdbc;

    public AdminAuditController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<Map<String, Object>> recentEvents() {
        return jdbc.queryForList("""
            SELECT actor_issuer, actor_subject, action, resource, resource_id, occurred_at
            FROM admin_audit_log ORDER BY occurred_at DESC LIMIT 100
            """);
    }
}
