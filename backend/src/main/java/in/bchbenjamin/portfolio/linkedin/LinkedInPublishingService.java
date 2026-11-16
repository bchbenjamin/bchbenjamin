package in.bchbenjamin.portfolio.linkedin;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class LinkedInPublishingService {
    private final JdbcTemplate jdbc;
    private final OAuth2AuthorizedClientService authorizedClients;
    private final RestClient restClient;
    private final String apiVersion;

    public LinkedInPublishingService(JdbcTemplate jdbc, OAuth2AuthorizedClientService authorizedClients,
                                     @Value("${app.linkedin.api-version:}") String apiVersion) {
        this.jdbc = jdbc;
        this.authorizedClients = authorizedClients;
        this.apiVersion = apiVersion;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5_000);
        requestFactory.setReadTimeout(20_000);
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    public Map<String, Object> connectionStatus(OidcUser actor) {
        Integer count = jdbc.queryForObject("SELECT count(*) FROM linkedin_authorized_clients WHERE principal_name = ? AND registration_id = 'linkedin-publisher'", Integer.class, actor.getName());
        OAuth2AuthorizedClient client = authorizedClients.loadAuthorizedClient("linkedin-publisher", actor.getName());
        boolean connected = count != null && count > 0 && client != null && !client.getAccessToken().isExpired();
        return Map.of("connected", connected, "provider", "LinkedIn", "publishingPermission", "w_member_social");
    }

    public List<Map<String, Object>> drafts() {
        return jdbc.queryForList("""
            SELECT id, content, status, created_by, reviewed_by, reviewed_at,
                   linkedin_post_id, failure_code, created_at, updated_at, published_at
            FROM linkedin_publish_drafts ORDER BY created_at DESC LIMIT 100
            """);
    }

    public Map<String, Object> createDraft(String content, OidcUser actor) {
        if (content == null || content.isBlank() || content.length() > 3000) {
            throw new IllegalArgumentException("Post content must contain between 1 and 3000 characters");
        }
        UUID id = jdbc.queryForObject("""
            INSERT INTO linkedin_publish_drafts (content, status, created_by)
            VALUES (?, 'PENDING_REVIEW', ?) RETURNING id
            """, UUID.class, content.trim(), actor.getName());
        return getDraft(id);
    }

    public Map<String, Object> review(UUID id, boolean approve, OidcUser actor) {
        String status = approve ? "APPROVED" : "REJECTED";
        int changed = jdbc.update("""
            UPDATE linkedin_publish_drafts SET status = ?, reviewed_by = ?, reviewed_at = now(), updated_at = now()
            WHERE id = ? AND status = 'PENDING_REVIEW'
            """, status, actor.getName(), id);
        if (changed == 0) throw new IllegalStateException("Only pending drafts can be approved or rejected");
        return getDraft(id);
    }

    public Map<String, Object> publish(UUID id, OidcUser actor) {
        OAuth2AuthorizedClient client = authorizedClients.loadAuthorizedClient("linkedin-publisher", actor.getName());
        if (client == null || client.getAccessToken().isExpired()) {
            throw new IllegalStateException("Connect or reconnect LinkedIn publishing before publishing");
        }
        if (apiVersion == null || !apiVersion.matches("\\d{6}")) {
            throw new IllegalStateException("Set LINKEDIN_API_VERSION to a currently supported YYYYMM API version");
        }
        Map<String, Object> draft = getDraft(id);
        if (!"APPROVED".equals(draft.get("status"))) throw new IllegalStateException("A draft must be approved before publishing");
        int claimed = jdbc.update("""
            UPDATE linkedin_publish_drafts SET status = 'PUBLISHING', updated_at = now()
            WHERE id = ? AND status = 'APPROVED'
            """, id);
        if (claimed == 0) throw new IllegalStateException("This draft is no longer approved for publishing");

        Map<String, Object> payload = Map.of(
            "author", "urn:li:person:" + actor.getSubject(),
            "commentary", draft.get("content"),
            "visibility", "PUBLIC",
            "distribution", Map.of("feedDistribution", "MAIN_FEED", "targetEntities", List.of(), "thirdPartyDistributionChannels", List.of()),
            "lifecycleState", "PUBLISHED",
            "isReshareDisabledByAuthor", false
        );
        try {
            var response = restClient.post()
                .uri("https://api.linkedin.com/rest/posts")
                .header("Authorization", "Bearer " + client.getAccessToken().getToken())
                .header("Linkedin-Version", apiVersion)
                .header("X-Restli-Protocol-Version", "2.0.0")
                .header("Content-Type", "application/json")
                .body(payload)
                .retrieve()
                .toBodilessEntity();
            String postId = response.getHeaders().getFirst("x-restli-id");
            jdbc.update("""
                UPDATE linkedin_publish_drafts SET status = 'PUBLISHED', linkedin_post_id = ?,
                    published_at = now(), updated_at = now() WHERE id = ? AND status = 'PUBLISHING'
                """, postId, id);
        } catch (RestClientException exception) {
            jdbc.update("""
                UPDATE linkedin_publish_drafts SET status = 'PUBLISH_FAILED', failure_code = 'LINKEDIN_API_ERROR', updated_at = now()
                WHERE id = ? AND status = 'PUBLISHING'
                """, id);
        }
        return getDraft(id);
    }

    private Map<String, Object> getDraft(UUID id) {
        return jdbc.query("SELECT * FROM linkedin_publish_drafts WHERE id = ?", rs -> {
            if (!rs.next()) throw new IllegalArgumentException("LinkedIn draft not found");
            Map<String, Object> result = new java.util.LinkedHashMap<>();
            var metadata = rs.getMetaData();
            for (int i = 1; i <= metadata.getColumnCount(); i++) result.put(metadata.getColumnLabel(i), rs.getObject(i));
            return result;
        }, id);
    }
}
