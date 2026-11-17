package in.bchbenjamin.portfolio.resume;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class ResumeGenerationService {
    private static final Set<String> GENERIC_MATCH_TERMS = Set.of(
        "software", "system", "systems", "application", "applications", "platform", "platforms",
        "build", "built", "building", "deliver", "delivered", "delivery", "provide", "provided",
        "implement", "implemented", "implementation", "develop", "developed", "developer", "development",
        "using", "used", "use", "with", "without", "from", "this", "that", "these", "those",
        "into", "onto", "their", "there", "where", "which", "while", "when", "what", "your",
        "work", "works", "working", "workflow", "workflows", "project", "projects", "team", "teams",
        "experience", "role", "roles", "technical", "technology", "technologies", "skill", "skills",
        "solution", "solutions", "based", "including", "include", "includes", "support", "supports",
        "service", "services", "management", "manage", "managed", "real", "time"
    );
    public record GeneratedResume(UUID id, String mode, String templateId, String modelUsed,
                                  Instant createdAt, Map<String, Object> matchReport) { }

    private final JdbcTemplate jdbc;
    private final ResumePdfService pdfService;
    private final ObjectMapper mapper;
    private final RestClient restClient;
    private final String aiBaseUrl;
    private final String aiApiKey;
    private final String aiModel;

    public ResumeGenerationService(JdbcTemplate jdbc, ResumePdfService pdfService, ObjectMapper mapper,
                                   RestClient.Builder restClientBuilder,
                                   @Value("${app.resume.ai-base-url:}") String aiBaseUrl,
                                   @Value("${app.resume.ai-api-key:}") String aiApiKey,
                                   @Value("${app.resume.ai-model:}") String aiModel) {
        this.jdbc = jdbc;
        this.pdfService = pdfService;
        this.mapper = mapper;
        this.restClient = restClientBuilder.build();
        this.aiBaseUrl = aiBaseUrl;
        this.aiApiKey = aiApiKey;
        this.aiModel = aiModel;
    }

    public GeneratedResume generate(String requestedMode, String jobDescription, String templateId) {
        String mode = requestedMode == null ? "general" : requestedMode.trim().toLowerCase();
        if (!Set.of("general", "job", "jd", "job_description").contains(mode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mode must be general or job");
        }
        if (!"ats".equals(templateId == null || templateId.isBlank() ? "ats" : templateId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only the ATS template is available");
        }
        boolean jobMode = !"general".equals(mode);
        if (jobMode && (jobDescription == null || jobDescription.strip().length() < 80)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide a complete job description (at least 80 characters)");
        }

        Map<String, Object> snapshot = loadSourceSnapshot();
        Map<String, Object> report = jobMode ? match(jobDescription, snapshot) : Map.of("type", "general", "message", "Uses the complete verified owner profile.");
        ResumeSelection selection = jobMode ? selectionFrom(report) : ResumeSelection.all();
        byte[] pdf = pdfService.render("resume", selection);
        String selectionJson = writeJson(selection);
        String snapshotJson = writeJson(snapshot);
        String reportJson = writeJson(report);
        UUID id = UUID.randomUUID();
        jdbc.update("""
            INSERT INTO resume_generations
              (id, mode, template_id, job_description, source_snapshot, selection, match_report, model_used, pdf_bytes)
            VALUES (?, ?, 'ats', ?, ?::jsonb, ?::jsonb, ?::jsonb, ?, ?)
            """, id, jobMode ? "JOB_DESCRIPTION" : "GENERAL", jobMode ? jobDescription.strip() : null,
            snapshotJson, selectionJson, reportJson, report.get("modelUsed"), pdf);
        return new GeneratedResume(id, jobMode ? "JOB_DESCRIPTION" : "GENERAL", "ats",
            report.get("modelUsed") == null ? null : String.valueOf(report.get("modelUsed")), Instant.now(), report);
    }

    public List<Map<String, Object>> list() {
        return jdbc.queryForList("""
            SELECT id, mode, template_id, LEFT(job_description, 220) AS job_description_preview,
                   model_used, created_at, octet_length(pdf_bytes) AS pdf_bytes
            FROM resume_generations ORDER BY created_at DESC LIMIT 100
            """);
    }

    public byte[] download(UUID id) {
        return jdbc.query("SELECT pdf_bytes FROM resume_generations WHERE id = ?", rs -> {
            if (!rs.next()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume not found");
            return rs.getBytes(1);
        }, id);
    }

    public void delete(UUID id) {
        if (jdbc.update("DELETE FROM resume_generations WHERE id = ?", id) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume not found");
        }
    }

    private Map<String, Object> loadSourceSnapshot() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("profile", firstOrEmpty(jdbc.queryForList("SELECT full_name, headline, summary, email, location, website_url, github_url, linkedin_url FROM profile ORDER BY updated_at DESC LIMIT 1")));
        result.put("projects", jdbc.queryForList("SELECT id, name, tagline, summary, resume_description FROM projects WHERE resume_included = TRUE ORDER BY featured DESC, sort_order, name"));
        result.put("experience", jdbc.queryForList("SELECT id, role_title, organization, employment_type, description, started_on, ended_on, is_current FROM experience WHERE resume_included = TRUE ORDER BY sort_order, started_on DESC"));
        result.put("education", jdbc.queryForList("SELECT id, institution, qualification, field_of_study, description, started_on, ended_on, grade FROM education WHERE resume_included = TRUE ORDER BY sort_order, started_on DESC"));
        result.put("skills", jdbc.queryForList("SELECT s.id, g.name AS group_name, s.name FROM skill_groups g JOIN skills s ON s.group_id = g.id WHERE s.resume_included = TRUE ORDER BY g.sort_order, s.sort_order, s.name"));
        result.put("achievements", jdbc.queryForList("SELECT id, category, title, detail, issuer, awarded_on FROM achievements WHERE resume_included = TRUE ORDER BY sort_order, awarded_on DESC"));
        return result;
    }

    private Map<String, Object> match(String jobDescription, Map<String, Object> sources) {
        if (aiBaseUrl.isBlank() || aiApiKey.isBlank() || aiModel.isBlank()) return deterministicMatch(jobDescription, sources);
        try {
            String instruction = """
                You are a resume evidence selector, not a resume writer. Match a job description to the supplied verified career records.
                Return only JSON with keys: projects, experience, education, skills, achievements, matchedRequirements, gaps.
                Each of the first five keys must be an array of UUID strings copied exactly from the source records.
                matchedRequirements must be an array of {requirement, sourceIds}; sourceIds must contain only supplied UUIDs.
                gaps must be an array of job requirements with no supporting source record.
                Select, rank and prioritize only evidence actually present. Do not invent skills, metrics, employers, degrees, titles or outcomes.
                Never produce new resume prose. The final document uses the original stored facts verbatim.
                Prefer directly relevant evidence, preserve recency, and do not select an item merely because it shares a broad keyword.
                """;
            Map<String, Object> request = Map.of(
                "model", aiModel,
                "temperature", 0,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                    Map.of("role", "system", "content", instruction),
                    Map.of("role", "user", "content", "JOB DESCRIPTION:\n" + jobDescription + "\n\nVERIFIED PROFILE RECORDS:\n" + writeJson(sources))
                )
            );
            Map<?, ?> response = restClient.post().uri(aiBaseUrl).contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON).header("Authorization", "Bearer " + aiApiKey).body(request).retrieve().body(Map.class);
            String content = String.valueOf(((Map<?, ?>) ((Map<?, ?>) ((List<?>) response.get("choices")).getFirst()).get("message")).get("content"));
            Map<String, Object> raw = mapper.readValue(content, new TypeReference<>() { });
            return validateModelSelection(raw, sources);
        } catch (Exception exception) {
            Map<String, Object> fallback = deterministicMatch(jobDescription, sources);
            fallback.put("warning", "The configured AI service was unavailable or returned an invalid selection. A local keyword-based selection was used.");
            return fallback;
        }
    }

    private Map<String, Object> validateModelSelection(Map<String, Object> raw, Map<String, Object> sources) {
        Map<String, Set<String>> allowed = new LinkedHashMap<>();
        for (String key : List.of("projects", "experience", "education", "skills", "achievements")) {
            Object rows = sources.get(key);
            Set<String> ids = rows instanceof List<?> list ? list.stream().filter(Map.class::isInstance)
                .map(Map.class::cast).map(item -> String.valueOf(item.get("id"))).collect(Collectors.toSet()) : Set.of();
            allowed.put(key, ids);
        }
        Map<String, Object> checked = new LinkedHashMap<>();
        for (String key : allowed.keySet()) {
            Set<String> permitted = allowed.get(key);
            checked.put(key, strings(raw.get(key)).stream().filter(permitted::contains).distinct().limit(12).toList());
        }
        List<Map<String, Object>> requirements = new ArrayList<>();
        Object matched = raw.get("matchedRequirements");
        if (matched instanceof List<?> list) for (Object item : list) if (item instanceof Map<?, ?> row) {
            List<String> ids = strings(row.get("sourceIds"));
            Set<String> allAllowed = allowed.values().stream().flatMap(Set::stream).collect(Collectors.toSet());
            List<String> verified = ids.stream().filter(allAllowed::contains).distinct().toList();
            if (!verified.isEmpty()) requirements.add(Map.of("requirement", row.containsKey("requirement") ? String.valueOf(row.get("requirement")) : "Requirement", "sourceIds", verified));
        }
        checked.put("matchedRequirements", requirements);
        checked.put("gaps", strings(raw.get("gaps")).stream().limit(30).toList());
        checked.put("method", "AI-ranked verified records; the PDF retains source wording.");
        checked.put("modelUsed", aiModel);
        checked.put("truthfulness", "Only source record IDs are accepted. Generated prose is not used.");
        return checked;
    }

    private Map<String, Object> deterministicMatch(String jobDescription, Map<String, Object> sources) {
        Set<String> terms = Pattern.compile("[a-zA-Z][a-zA-Z0-9+#.]{2,}").matcher(jobDescription.toLowerCase()).results()
            .map(MatchResult -> MatchResult.group()).collect(Collectors.toSet());
        Map<String, Object> output = new LinkedHashMap<>();
        Map<String, List<Map<String, Object>>> collections = Map.of(
            "projects", castRows(sources.get("projects")),
            "experience", castRows(sources.get("experience")),
            "education", castRows(sources.get("education")),
            "skills", castRows(sources.get("skills")),
            "achievements", castRows(sources.get("achievements"))
        );
        for (String key : collections.keySet()) {
            List<String> selected = collections.get(key).stream()
                .map(row -> Map.entry(row, overlap(row.values().stream().map(String::valueOf).collect(Collectors.joining(" ")).toLowerCase(), terms)))
                .filter(entry -> entry.getValue() > 0)
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .map(entry -> String.valueOf(entry.getKey().get("id"))).limit("skills".equals(key) ? 18 : 8).toList();
            output.put(key, selected);
        }
        output.put("matchedRequirements", List.of());
        output.put("gaps", List.of());
        output.put("method", "Local deterministic keyword overlap; configure RESUME_AI_* for semantic ranking.");
        output.put("modelUsed", null);
        output.put("matchedTerms", terms.stream().filter(term -> collections.values().stream().flatMap(List::stream)
            .anyMatch(row -> row.values().stream().map(String::valueOf).collect(Collectors.joining(" ")).toLowerCase().contains(term))).sorted().toList());
        return output;
    }

    private static ResumeSelection selectionFrom(Map<String, Object> report) {
        return new ResumeSelection(toUuids(report.get("projects")), toUuids(report.get("experience")),
            toUuids(report.get("education")), toUuids(report.get("skills")), toUuids(report.get("achievements")), false);
    }

    private static List<UUID> toUuids(Object value) {
        List<UUID> ids = new ArrayList<>();
        for (String candidate : strings(value)) {
            try { ids.add(UUID.fromString(candidate)); }
            catch (IllegalArgumentException ignored) { /* Reject identifiers that are not UUIDs. */ }
        }
        return ids;
    }

    private static int overlap(String text, Set<String> terms) {
        // Generic résumé/job-description vocabulary creates false positives across unrelated
        // records. Score only discriminative terms such as named languages, frameworks and domains.
        return (int) terms.stream().filter(term -> !GENERIC_MATCH_TERMS.contains(term) && text.contains(term)).count();
    }

    private static List<Map<String, Object>> castRows(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        return list.stream().filter(Map.class::isInstance).map(item -> (Map<String, Object>) item).toList();
    }

    private static List<String> strings(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        return list.stream().filter(String.class::isInstance).map(String.class::cast).toList();
    }

    private static Map<String, Object> firstOrEmpty(List<Map<String, Object>> rows) {
        return rows.isEmpty() ? Map.of() : rows.getFirst();
    }

    private String writeJson(Object value) {
        try { return mapper.writeValueAsString(value); }
        catch (Exception exception) { throw new IllegalStateException("Could not serialize resume generation data", exception); }
    }
}
