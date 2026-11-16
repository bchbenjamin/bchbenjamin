package in.bchbenjamin.portfolio.agent;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1/agent")
public class AgentReadController {
    private final JdbcTemplate jdbc;

    public AgentReadController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping("/profile")
    @PreAuthorize("hasAuthority('SCOPE_portfolio:read')")
    public Map<String, Object> profile() {
        return jdbc.query("SELECT full_name, headline, summary, location, email, website_url, github_url, linkedin_url FROM profile WHERE published = TRUE ORDER BY updated_at DESC LIMIT 1", rs -> {
            if (!rs.next()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found");
            Map<String, Object> result = new java.util.LinkedHashMap<>();
            var metadata = rs.getMetaData();
            for (int i = 1; i <= metadata.getColumnCount(); i++) result.put(metadata.getColumnLabel(i), rs.getObject(i));
            return result;
        });
    }

    @GetMapping("/projects")
    @PreAuthorize("hasAuthority('SCOPE_portfolio:read')")
    public List<Map<String, Object>> projects() {
        return jdbc.queryForList("SELECT slug, name, tagline, summary, description, repository_url, live_url FROM projects WHERE published = TRUE ORDER BY sort_order, name");
    }

    @GetMapping("/projects/{slug}")
    @PreAuthorize("hasAuthority('SCOPE_portfolio:read')")
    public Map<String, Object> project(@PathVariable String slug) {
        return jdbc.query("SELECT slug, name, tagline, summary, description, repository_url, live_url FROM projects WHERE published = TRUE AND slug = ?", rs -> {
            if (!rs.next()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
            Map<String, Object> result = new java.util.LinkedHashMap<>();
            var metadata = rs.getMetaData();
            for (int i = 1; i <= metadata.getColumnCount(); i++) result.put(metadata.getColumnLabel(i), rs.getObject(i));
            return result;
        }, slug);
    }
}
