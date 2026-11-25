package in.bchbenjamin.portfolio.admin;

import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
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
    @Transactional
    public Map<String, Object> saveDraft(@RequestBody Map<String, Object> config, @AuthenticationPrincipal OidcUser actor) {
        String json = write(config);
        jdbc.update("""
            UPDATE site_configuration
            SET draft_config = jsonb_set(
                CAST(? AS jsonb), '{launcher}',
                (CASE WHEN jsonb_typeof(CAST(? AS jsonb)->'launcher') = 'object'
                      THEN CAST(? AS jsonb)->'launcher' ELSE '{}'::jsonb END)
                  || jsonb_build_object('homeLayout', COALESCE(
                      draft_config #> '{launcher,homeLayout}',
                      published_config #> '{launcher,homeLayout}',
                      '{"icons":{},"widgets":{}}'::jsonb)), TRUE),
                updated_at = now()
            WHERE id = 1
            """, json, json, json);
        audit.record(actor, "UPDATE", "site-configuration", null);
        return get();
    }

    @PutMapping("/launcher-layout")
    @Transactional
    public Map<String, Object> syncLauncherLayout(@RequestBody Map<String, Object> body,
                                                   @AuthenticationPrincipal OidcUser actor) {
        Map<String, Object> layout = sanitizeLauncherLayout(body);
        String json = write(layout);
        int changed = jdbc.update("""
            UPDATE site_configuration
            SET draft_config = jsonb_set(
                    COALESCE(draft_config, '{}'::jsonb), '{launcher}',
                    (CASE WHEN jsonb_typeof(draft_config->'launcher') = 'object' THEN draft_config->'launcher' ELSE '{}'::jsonb END) || jsonb_build_object('homeLayout', CAST(? AS jsonb)), TRUE),
                published_config = jsonb_set(
                    COALESCE(published_config, '{}'::jsonb), '{launcher}',
                    (CASE WHEN jsonb_typeof(published_config->'launcher') = 'object' THEN published_config->'launcher' ELSE '{}'::jsonb END) || jsonb_build_object('homeLayout', CAST(? AS jsonb)), TRUE),
                updated_at = now()
            WHERE id = 1
            """, json, json);
        if (changed != 1) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Launcher configuration is unavailable");
        audit.record(actor, "SYNC", "launcher-layout", null);
        return layout;
    }

    private static Map<String, Object> sanitizeLauncherLayout(Map<String, Object> body) {
        Object iconValue = body.get("icons");
        Object widgetValue = body.get("widgets");
        if (!(iconValue instanceof Map<?, ?> iconMap) || !(widgetValue instanceof Map<?, ?> widgetMap)
                || iconMap.size() > 128 || widgetMap.size() > 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid launcher layout");
        }
        Map<String, Object> icons = new LinkedHashMap<>();
        for (var entry : iconMap.entrySet()) {
            String id = String.valueOf(entry.getKey());
            if (!id.matches("[A-Za-z0-9-]{1,64}") || !(entry.getValue() instanceof Map<?, ?> position)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid launcher icon position");
            }
            int panel = boundedInteger(position.get("panel"), -1, 4, "icon panel");
            int slot = boundedInteger(position.get("slot"), -1, 15, "icon slot");
            if ((panel == -1 && slot != -1) || (panel >= 0 && slot < 0)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hidden icons must use panel and slot -1");
            }
            icons.put(id, Map.of("panel", panel, "slot", slot));
        }
        Set<String> widgetIds = Set.of("search", "clock", "gallery");
        Map<String, Object> widgets = new LinkedHashMap<>();
        for (var entry : widgetMap.entrySet()) {
            String id = String.valueOf(entry.getKey());
            if (!widgetIds.contains(id) || !(entry.getValue() instanceof Map<?, ?> position)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid launcher widget position");
            }
            int panel = boundedInteger(position.get("panel"), 0, 4, "widget panel");
            int row = boundedInteger(position.get("row"), 0, 8, "widget row");
            int maxColumn = id.equals("clock") ? 2 : 0;
            int column = boundedInteger(position.get("column"), 0, maxColumn, "widget column");
            widgets.put(id, Map.of("panel", panel, "row", row, "column", column));
        }
        return Map.of("icons", icons, "widgets", widgets);
    }

    private static int boundedInteger(Object value, int min, int max, String field) {
        if (!(value instanceof Number number)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + field);
        double raw = number.doubleValue();
        if (!Double.isFinite(raw) || raw != Math.rint(raw) || raw < min || raw > max) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + field);
        }
        return (int) raw;
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
