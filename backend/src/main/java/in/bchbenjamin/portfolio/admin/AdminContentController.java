package in.bchbenjamin.portfolio.admin;

import java.sql.Date;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/admin/content")
public class AdminContentController {
    private record ResourceSpec(String table, Map<String, String> fields, Set<String> required, String orderBy) { }

    private static final Map<String, ResourceSpec> RESOURCES = Map.of(
        "profile", spec("profile", fields("fullName", "full_name", "headline", "headline", "summary", "summary", "location", "location", "email", "email", "websiteUrl", "website_url", "githubUrl", "github_url", "linkedinUrl", "linkedin_url", "profilePhotoId", "profile_photo_id", "published", "published", "publicFields", "public_fields", "customFields", "custom_fields"), Set.of("fullName", "headline", "summary"), "updated_at DESC"),
        "projects", spec("projects", fields("slug", "slug", "name", "name", "tagline", "tagline", "summary", "summary", "description", "description", "shortDescription", "short_description", "resumeDescription", "resume_description", "role", "role", "status", "status", "repositoryUrl", "repository_url", "liveUrl", "live_url", "featured", "featured", "published", "published", "resumeIncluded", "resume_included", "sortOrder", "sort_order", "startedOn", "started_on", "completedOn", "completed_on", "publicFields", "public_fields", "customFields", "custom_fields"), Set.of("slug", "name", "tagline", "summary", "description", "status"), "sort_order, name"),
        "experience", spec("experience", fields("roleTitle", "role_title", "organization", "organization", "employmentType", "employment_type", "location", "location", "description", "description", "startedOn", "started_on", "endedOn", "ended_on", "isCurrent", "is_current", "published", "published", "resumeIncluded", "resume_included", "sortOrder", "sort_order", "publicFields", "public_fields", "customFields", "custom_fields"), Set.of("roleTitle", "organization", "description"), "sort_order, started_on DESC"),
        "education", spec("education", fields("institution", "institution", "qualification", "qualification", "fieldOfStudy", "field_of_study", "location", "location", "description", "description", "startedOn", "started_on", "endedOn", "ended_on", "grade", "grade", "published", "published", "resumeIncluded", "resume_included", "sortOrder", "sort_order", "publicFields", "public_fields", "customFields", "custom_fields"), Set.of("institution", "qualification"), "sort_order, started_on DESC"),
        "skill-groups", spec("skill_groups", fields("name", "name", "description", "description", "published", "published", "sortOrder", "sort_order", "publicFields", "public_fields", "customFields", "custom_fields"), Set.of("name"), "sort_order, name"),
        "skills", spec("skills", fields("groupId", "group_id", "name", "name", "proficiency", "proficiency", "resumeIncluded", "resume_included", "sortOrder", "sort_order", "publicFields", "public_fields", "customFields", "custom_fields"), Set.of("groupId", "name"), "group_id, sort_order, name"),
        "achievements", spec("achievements", fields("category", "category", "title", "title", "detail", "detail", "awardedOn", "awarded_on", "issuer", "issuer", "credentialUrl", "credential_url", "published", "published", "resumeIncluded", "resume_included", "sortOrder", "sort_order", "publicFields", "public_fields", "customFields", "custom_fields"), Set.of("category", "title", "detail"), "sort_order, awarded_on DESC")
    );

    private final NamedParameterJdbcTemplate jdbc;
    private final AdminAuditService audit;
    private final ObjectMapper mapper;

    public AdminContentController(NamedParameterJdbcTemplate jdbc, AdminAuditService audit, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.audit = audit;
        this.mapper = mapper;
    }

    @GetMapping("/{resource}")
    public List<Map<String, Object>> list(@PathVariable String resource) {
        ResourceSpec spec = resource(resource);
        List<Map<String, Object>> rows = jdbc.getJdbcTemplate().queryForList("SELECT * FROM " + spec.table() + " ORDER BY " + spec.orderBy() + " LIMIT 500");
        return rows.stream().map(row -> {
            Map<String, Object> decoded = new LinkedHashMap<>(row);
            for (String column : List.of("public_fields", "custom_fields")) {
                Object value = decoded.get(column);
                if (value != null) {
                    try { decoded.put(column, mapper.readValue(String.valueOf(value), new TypeReference<Map<String, Object>>() { })); }
                    catch (Exception ignored) { decoded.put(column, Map.of()); }
                }
            }
            return decoded;
        }).toList();
    }

    @GetMapping("/{resource}/{id}")
    public Map<String, Object> get(@PathVariable String resource, @PathVariable UUID id) {
        ResourceSpec spec = resource(resource);
        return jdbc.query("SELECT * FROM " + spec.table() + " WHERE id = :id", Map.of("id", id), rs -> {
            if (!rs.next()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Content item not found");
            Map<String, Object> result = new LinkedHashMap<>();
            var metadata = rs.getMetaData();
            for (int i = 1; i <= metadata.getColumnCount(); i++) {
                String label = metadata.getColumnLabel(i);
                Object value = rs.getObject(i);
                if ((label.equals("public_fields") || label.equals("custom_fields")) && value != null) {
                    try { value = mapper.readValue(String.valueOf(value), new TypeReference<Map<String, Object>>() { }); }
                    catch (Exception ignored) { value = Map.of(); }
                }
                result.put(label, value);
            }
            return result;
        });
    }

    @PostMapping("/{resource}")
    @Transactional
    public Map<String, Object> create(@PathVariable String resource, @RequestBody Map<String, Object> body,
                                      @AuthenticationPrincipal OidcUser actor) {
        ResourceSpec spec = resource(resource);
        Map<String, Object> values = sanitize(spec, body, true);
        String columns = values.keySet().stream().map(spec.fields()::get).collect(Collectors.joining(", "));
        String parameters = values.keySet().stream().map(key -> spec.fields().get(key).endsWith("_fields") ? "CAST(:" + key + " AS jsonb)" : ":" + key).collect(Collectors.joining(", "));
        UUID id = jdbc.queryForObject("INSERT INTO " + spec.table() + " (" + columns + ") VALUES (" + parameters + ") RETURNING id", params(values), UUID.class);
        audit.record(actor, "CREATE", resource, id);
        return get(resource, id);
    }

    @PutMapping("/{resource}/{id}")
    @Transactional
    public Map<String, Object> update(@PathVariable String resource, @PathVariable UUID id, @RequestBody Map<String, Object> body,
                                      @AuthenticationPrincipal OidcUser actor) {
        ResourceSpec spec = resource(resource);
        Map<String, Object> values = sanitize(spec, body, false);
        if (values.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No editable fields supplied");
        String assignments = values.keySet().stream().map(key -> spec.fields().get(key) + " = " + (spec.fields().get(key).endsWith("_fields") ? "CAST(:" + key + " AS jsonb)" : ":" + key)).collect(Collectors.joining(", "));
        MapSqlParameterSource parameters = params(values).addValue("id", id);
        int changed = jdbc.update("UPDATE " + spec.table() + " SET " + assignments + ", updated_at = now() WHERE id = :id", parameters);
        if (changed == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Content item not found");
        audit.record(actor, "UPDATE", resource, id);
        return get(resource, id);
    }

    @DeleteMapping("/{resource}/{id}")
    @Transactional
    public void delete(@PathVariable String resource, @PathVariable UUID id,
                       @AuthenticationPrincipal OidcUser actor) {
        ResourceSpec spec = resource(resource);
        int changed = jdbc.update("DELETE FROM " + spec.table() + " WHERE id = :id", Map.of("id", id));
        if (changed == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Content item not found");
        audit.record(actor, "DELETE", resource, id);
    }

    private static ResourceSpec resource(String name) {
        ResourceSpec spec = RESOURCES.get(name);
        if (spec == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown content resource");
        return spec;
    }

    private static ResourceSpec spec(String table, Map<String, String> fields, Set<String> required, String orderBy) {
        return new ResourceSpec(table, fields, required, orderBy);
    }

    private static Map<String, String> fields(String... pairs) {
        Map<String, String> result = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) result.put(pairs[i], pairs[i + 1]);
        return Map.copyOf(result);
    }

    private static Map<String, Object> sanitize(ResourceSpec spec, Map<String, Object> body, boolean creating) {
        if (body == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A JSON object is required");
        if (creating) {
            Set<String> missing = spec.required().stream()
                .filter(key -> !body.containsKey(key) || body.get(key) == null || body.get(key).toString().isBlank())
                .collect(Collectors.toSet());
            if (!missing.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Missing required fields: " + String.join(", ", missing));
        }
        Map<String, Object> values = new LinkedHashMap<>();
        for (var entry : body.entrySet()) {
            if (!spec.fields().containsKey(entry.getKey())) continue;
            Object value = entry.getValue();
            String column = spec.fields().get(entry.getKey());
            if (column.endsWith("_fields") && value != null) {
                try { value = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(value); }
                catch (Exception exception) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JSON field metadata"); }
            }
            if (value instanceof String text && (column.endsWith("_on"))) value = text.isBlank() ? null : Date.valueOf(LocalDate.parse(text));
            if (value instanceof String text && column.endsWith("_id")) value = UUID.fromString(text);
            values.put(entry.getKey(), value);
        }
        if (values.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No supported fields supplied");
        return values;
    }

    private static MapSqlParameterSource params(Map<String, Object> values) {
        MapSqlParameterSource parameters = new MapSqlParameterSource();
        values.forEach(parameters::addValue);
        return parameters;
    }
}
