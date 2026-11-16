package in.bchbenjamin.portfolio;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/public")
public class PublicPortfolioController {
    private final JdbcTemplate jdbc;

    public PublicPortfolioController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/profile")
    public Map<String, Object> profile() {
        return jdbc.query("""
            SELECT full_name, headline, summary, location, email, website_url,
                   github_url, linkedin_url
            FROM profile WHERE published = TRUE ORDER BY updated_at DESC LIMIT 1
            """, (rs, rowNum) -> Map.<String, Object>of(
                "fullName", rs.getString("full_name"),
                "headline", rs.getString("headline"),
                "summary", rs.getString("summary"),
                "location", rs.getString("location") == null ? "" : rs.getString("location"),
                "email", rs.getString("email") == null ? "" : rs.getString("email"),
                "websiteUrl", rs.getString("website_url") == null ? "" : rs.getString("website_url"),
                "githubUrl", rs.getString("github_url") == null ? "" : rs.getString("github_url"),
                "linkedinUrl", rs.getString("linkedin_url") == null ? "" : rs.getString("linkedin_url")
            )).stream().findFirst().orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
    }

    @GetMapping("/projects")
    public List<Map<String, Object>> projects() {
        return jdbc.queryForList("""
            SELECT slug, name, tagline, summary, description, role, status,
                   repository_url, live_url, featured, started_on, completed_on
            FROM projects WHERE published = TRUE ORDER BY sort_order, name
            """);
    }

    @GetMapping("/projects/{slug}")
    public Map<String, Object> project(@PathVariable String slug) {
        return jdbc.query("""
            SELECT slug, name, tagline, summary, description, role, status,
                   repository_url, live_url, featured, started_on, completed_on
            FROM projects WHERE published = TRUE AND slug = ?
            """, (rs, rowNum) -> Map.<String, Object>ofEntries(
                Map.entry("slug", rs.getString("slug")),
                Map.entry("name", rs.getString("name")),
                Map.entry("tagline", rs.getString("tagline")),
                Map.entry("summary", rs.getString("summary")),
                Map.entry("description", rs.getString("description")),
                Map.entry("role", rs.getString("role") == null ? "" : rs.getString("role")),
                Map.entry("status", rs.getString("status")),
                Map.entry("repositoryUrl", rs.getString("repository_url") == null ? "" : rs.getString("repository_url")),
                Map.entry("liveUrl", rs.getString("live_url") == null ? "" : rs.getString("live_url")),
                Map.entry("featured", rs.getBoolean("featured"))
            ), slug).stream().findFirst().orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    @GetMapping("/experience")
    public List<Map<String, Object>> experience() {
        return jdbc.queryForList("""
            SELECT role_title, organization, employment_type, location, description,
                   started_on, ended_on, is_current
            FROM experience WHERE published = TRUE ORDER BY sort_order, started_on DESC
            """);
    }

    @GetMapping("/education")
    public List<Map<String, Object>> education() {
        return jdbc.queryForList("""
            SELECT institution, qualification, field_of_study, location, description,
                   started_on, ended_on, grade
            FROM education WHERE published = TRUE ORDER BY sort_order, started_on DESC
            """);
    }

    @GetMapping("/skills")
    public List<Map<String, Object>> skills() {
        return jdbc.queryForList("""
            SELECT g.id AS group_id, g.name AS group_name, g.description AS group_description,
                   s.id AS skill_id, s.name AS skill_name, s.proficiency
            FROM skill_groups g LEFT JOIN skills s ON s.group_id = g.id
            WHERE g.published = TRUE ORDER BY g.sort_order, s.sort_order, s.name
            """);
    }

    @GetMapping("/achievements")
    public List<Map<String, Object>> achievements() {
        return jdbc.queryForList("""
            SELECT category, title, detail, awarded_on, issuer, credential_url
            FROM achievements WHERE published = TRUE ORDER BY sort_order, awarded_on DESC
            """);
    }
}
