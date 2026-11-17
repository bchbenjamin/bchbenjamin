package in.bchbenjamin.portfolio;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.LinkedHashMap;
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
    private static final List<String> PRIVATE_COLUMNS = List.of("id", "public_fields", "custom_fields", "created_at", "updated_at", "published", "sort_order", "gallery_image_url");
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public PublicPortfolioController(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    @GetMapping("/profile")
    public Map<String, Object> profile() {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM profile WHERE published = TRUE ORDER BY updated_at DESC LIMIT 1");
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found");
        return toPublicMap(rows.getFirst());
    }

    @GetMapping("/projects")
    public List<Map<String, Object>> projects() {
        return jdbc.queryForList("SELECT * FROM projects WHERE published = TRUE ORDER BY sort_order, name")
            .stream().map(this::toPublicMap).filter(row -> row.containsKey("name") && row.containsKey("slug")).toList();
    }

    @GetMapping("/projects/{slug}")
    public Map<String, Object> project(@PathVariable String slug) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM projects WHERE published = TRUE AND slug = ?", slug);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
        Map<String, Object> result = toPublicMap(rows.getFirst());
        if (!result.containsKey("name")) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
        result.put("media", mediaFor("project", rows.getFirst().get("id")));
        return result;
    }

    @GetMapping("/experience")
    public List<Map<String, Object>> experience() {
        return jdbc.queryForList("SELECT * FROM experience WHERE published = TRUE ORDER BY sort_order, started_on DESC")
            .stream().map(this::toPublicMap).filter(row -> row.containsKey("roleTitle") && row.containsKey("organization")).toList();
    }

    @GetMapping("/education")
    public List<Map<String, Object>> education() {
        return jdbc.queryForList("SELECT * FROM education WHERE published = TRUE ORDER BY sort_order, started_on DESC")
            .stream().map(this::toPublicMap).filter(row -> row.containsKey("institution") && row.containsKey("qualification")).toList();
    }

    @GetMapping("/skills")
    public List<Map<String, Object>> skills() {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT g.id AS group_id, g.name AS group_name, g.description AS group_description,
                   g.public_fields::text AS group_public_fields, g.custom_fields::text AS group_custom_fields,
                   s.id AS skill_id, s.name AS skill_name, s.proficiency,
                   s.public_fields::text AS skill_public_fields, s.custom_fields::text AS skill_custom_fields
            FROM skill_groups g LEFT JOIN skills s ON s.group_id = g.id
            WHERE g.published = TRUE ORDER BY g.sort_order, s.sort_order, s.name
            """);
        List<Map<String, Object>> visible = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> groupFields = parseObject(row.get("group_public_fields"));
            Map<String, Object> skillFields = parseObject(row.get("skill_public_fields"));
            if (Boolean.FALSE.equals(groupFields.get("name"))) continue;
            Map<String, Object> output = new LinkedHashMap<>();
            output.put("group_name", row.get("group_name"));
            if (isVisible(groupFields, "description")) output.put("group_description", row.get("group_description"));
            if (row.get("skill_id") != null && isVisible(skillFields, "name")) {
                output.put("skill_name", row.get("skill_name"));
                if (isVisible(skillFields, "proficiency")) output.put("proficiency", row.get("proficiency"));
            }
            visible.add(output);
        }
        return visible;
    }

    @GetMapping("/achievements")
    public List<Map<String, Object>> achievements() {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT a.*, (SELECT '/api/v1/public/media/' || m.id::text
                FROM media_relationships mr JOIN media_assets m ON m.id = mr.media_id
                WHERE mr.resource_type = 'achievement' AND mr.resource_id = a.id AND mr.purpose = 'gallery'
                  AND m.visibility = 'PUBLIC' AND m.content_type LIKE 'image/%'
                ORDER BY mr.sort_order, m.uploaded_at DESC LIMIT 1) AS gallery_image_url
            FROM achievements a WHERE a.published = TRUE ORDER BY a.awarded_on DESC NULLS LAST, a.sort_order
            """);
        return rows.stream().map(row -> {
            Map<String, Object> result = toPublicMap(row);
            if (row.get("gallery_image_url") != null) result.put("imageUrl", row.get("gallery_image_url"));
            return result;
        }).filter(row -> row.containsKey("title")).toList();
    }

    @GetMapping("/site-configuration")
    public Map<String, Object> siteConfiguration() {
        String json = jdbc.queryForObject("SELECT published_config::text FROM site_configuration WHERE id = 1", String.class);
        try { return mapper.readValue(json, new TypeReference<>() { }); }
        catch (Exception exception) { throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Site configuration is invalid"); }
    }

    private List<Map<String, Object>> mediaFor(String type, Object resourceId) {
        return jdbc.queryForList("""
            SELECT m.id, m.original_filename, m.content_type, m.alt_text, m.caption,
                   '/api/v1/public/media/' || m.id::text AS url
            FROM media_relationships mr JOIN media_assets m ON m.id = mr.media_id
            WHERE mr.resource_type = ? AND mr.resource_id = ? AND m.visibility = 'PUBLIC'
            ORDER BY mr.sort_order, m.uploaded_at DESC
            """, type, resourceId);
    }

    private Map<String, Object> toPublicMap(Map<String, Object> row) {
        Map<String, Object> visibility = parseObject(row.get("public_fields"));
        Map<String, Object> custom = parseObject(row.get("custom_fields"));
        Map<String, Object> result = new LinkedHashMap<>();
        row.forEach((column, value) -> {
            if (PRIVATE_COLUMNS.contains(column) || column.equals("custom_fields") || column.equals("gallery_image_url")) return;
            String field = camel(column);
            if (isVisible(visibility, field) && value != null) result.put(field, value);
        });
        custom.forEach((key, value) -> {
            if (Boolean.TRUE.equals(visibility.get("customFields." + key))) result.put(key, value);
        });
        return result;
    }

    private Map<String, Object> parseObject(Object value) {
        if (value == null) return Map.of();
        try { return mapper.readValue(String.valueOf(value), new TypeReference<>() { }); }
        catch (Exception ignored) { return Map.of(); }
    }

    private static boolean isVisible(Map<String, Object> visibility, String field) {
        Object exact = visibility.get(field);
        if (exact instanceof Boolean flag) return flag;
        return Boolean.TRUE.equals(visibility.get("*"));
    }

    private static String camel(String value) {
        StringBuilder output = new StringBuilder();
        boolean upper = false;
        for (char c : value.toCharArray()) {
            if (c == '_') upper = true;
            else { output.append(upper ? Character.toUpperCase(c) : c); upper = false; }
        }
        return output.toString();
    }
}
