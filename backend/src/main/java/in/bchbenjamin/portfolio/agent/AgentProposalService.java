package in.bchbenjamin.portfolio.agent;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AgentProposalService {
    private static final Set<String> RESOURCES = Set.of("profile", "projects", "experience", "education", "skills", "skill-groups", "achievements");
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public AgentProposalService(JdbcTemplate jdbc, ObjectMapper mapper) { this.jdbc = jdbc; this.mapper = mapper; }

    public Map<String, Object> create(String resource, String operation, UUID targetId, Map<String, Object> payload, String createdBy) {
        if (!RESOURCES.contains(resource)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported proposal resource");
        if (!Set.of("CREATE", "UPDATE", "DELETE").contains(operation)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported proposal operation");
        if (("UPDATE".equals(operation) || "DELETE".equals(operation)) && targetId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetId is required for update and delete proposals");
        if (!"DELETE".equals(operation) && (payload == null || payload.isEmpty())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A non-empty payload is required");
        try {
            String json = mapper.writeValueAsString(payload == null ? Map.of() : payload);
            UUID id = jdbc.queryForObject("""
                INSERT INTO agent_change_proposals (resource, operation, target_id, payload, created_by)
                VALUES (?, ?, ?, ?::jsonb, ?) RETURNING id
                """, UUID.class, resource, operation, targetId, json, createdBy);
            return get(id);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Proposal payload is not valid JSON");
        }
    }

    public List<Map<String, Object>> list() {
        return jdbc.queryForList("SELECT id, resource, operation, target_id, payload::text AS payload, status, created_by, reviewed_by, review_note, created_at, reviewed_at FROM agent_change_proposals ORDER BY created_at DESC LIMIT 200");
    }

    public Map<String, Object> review(UUID id, boolean approve, String reviewer, String note) {
        int changed = jdbc.update("""
            UPDATE agent_change_proposals SET status = ?, reviewed_by = ?, review_note = ?, reviewed_at = now()
            WHERE id = ? AND status = 'PENDING_REVIEW'
            """, approve ? "APPROVED" : "REJECTED", reviewer, note, id);
        if (changed == 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Proposal is not pending review");
        return get(id);
    }

    private Map<String, Object> get(UUID id) {
        return jdbc.query("SELECT id, resource, operation, target_id, payload::text AS payload, status, created_by, reviewed_by, review_note, created_at, reviewed_at FROM agent_change_proposals WHERE id = ?", rs -> {
            if (!rs.next()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found");
            Map<String, Object> result = new java.util.LinkedHashMap<>();
            var metadata = rs.getMetaData();
            for (int i = 1; i <= metadata.getColumnCount(); i++) result.put(metadata.getColumnLabel(i), rs.getObject(i));
            return result;
        }, id);
    }
}
