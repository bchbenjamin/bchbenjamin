package in.bchbenjamin.portfolio.admin;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/admin/custom-fields")
public class AdminCustomFieldController {
    private static final Set<String> RESOURCES = Set.of("profile", "project", "experience", "education", "skill-group", "skill", "achievement");
    private static final Set<String> TYPES = Set.of("text", "long-text", "url", "date", "number", "boolean", "select", "multi-select", "rich-text", "media");
    private final JdbcTemplate jdbc;
    private final AdminAuditService audit;
    private final ObjectMapper mapper;
    public AdminCustomFieldController(JdbcTemplate jdbc, AdminAuditService audit, ObjectMapper mapper) { this.jdbc = jdbc; this.audit = audit; this.mapper = mapper; }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam String resourceType) {
        validateResource(resourceType);
        return jdbc.queryForList("SELECT id, resource_type, field_key, label, field_type, options::text AS options, public_by_default, sort_order, created_at FROM custom_field_definitions WHERE resource_type = ? ORDER BY sort_order, label", resourceType);
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody FieldRequest request, @AuthenticationPrincipal OidcUser actor) {
        validateResource(request.resourceType());
        if (!TYPES.contains(request.fieldType())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported custom field type");
        if (request.fieldKey() == null || !request.fieldKey().matches("[a-zA-Z][a-zA-Z0-9_]{1,79}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a field key with 2–80 letters, numbers or underscores");
        if (request.label() == null || request.label().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A field label is required");
        String options = write(request.options() == null ? List.of() : request.options());
        UUID id = jdbc.queryForObject("INSERT INTO custom_field_definitions (resource_type, field_key, label, field_type, options, public_by_default, sort_order) VALUES (?, ?, ?, ?, ?::jsonb, ?, ?) RETURNING id",
            UUID.class, request.resourceType(), request.fieldKey(), request.label().trim(), request.fieldType(), options, request.publicByDefault(), request.sortOrder());
        audit.record(actor, "CREATE", "custom-field", id);
        return jdbc.queryForMap("SELECT id, resource_type, field_key, label, field_type, options::text AS options, public_by_default, sort_order, created_at FROM custom_field_definitions WHERE id = ?", id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal OidcUser actor) {
        if (jdbc.update("DELETE FROM custom_field_definitions WHERE id = ?", id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Custom field not found");
        audit.record(actor, "DELETE", "custom-field", id);
    }

    private void validateResource(String resource) {
        if (!RESOURCES.contains(resource)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown custom-field resource type");
    }
    private String write(Object value) {
        try { return mapper.writeValueAsString(value); }
        catch (Exception exception) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid field options"); }
    }
    public record FieldRequest(String resourceType, String fieldKey, String label, String fieldType,
                               List<String> options, boolean publicByDefault, int sortOrder) { }
}
