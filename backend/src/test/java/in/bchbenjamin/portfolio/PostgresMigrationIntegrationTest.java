package in.bchbenjamin.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import in.bchbenjamin.portfolio.agent.AgentTokenService;
import in.bchbenjamin.portfolio.linkedin.LinkedInPublishingService;
import in.bchbenjamin.portfolio.security.EncryptedLinkedInAuthorizedClientService;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import java.util.Set;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.test.web.servlet.MvcResult;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class PostgresMigrationIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine")
        .withDatabaseName("portfolio")
        .withUsername("portfolio")
        .withPassword("integration-test-password");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("app.security.token-encryption-key", () -> Base64.getEncoder().encodeToString(new byte[32]));
        registry.add("app.linkedin.api-version", () -> "202607");
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private AgentTokenService agentTokens;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private ClientRegistrationRepository clientRegistrations;
    @Autowired private EncryptedLinkedInAuthorizedClientService authorizedClients;
    @Autowired private LinkedInPublishingService linkedInPublishing;

    @Test
    void flywayCreatesThePortfolioSchemaAndSeedData() throws Exception {
        mockMvc.perform(get("/api/v1/public/projects"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(4))
            .andExpect(jsonPath("$[0].slug").value("awarespan"));
        mockMvc.perform(get("/api/v1/public/profile"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fullName").value("Benjamin"));
    }

    @Test
    void resumePdfIsGeneratedAsARealPdfDocument() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/public/resume.pdf?variant=resume"))
            .andExpect(status().isOk())
            .andReturn();
        assertTrue(result.getResponse().getContentType().startsWith("application/pdf"));
        byte[] bytes = result.getResponse().getContentAsByteArray();
        assertTrue(bytes.length > 500);
        assertTrue(new String(bytes, 0, 4).equals("%PDF"));
        try (var document = PDDocument.load(bytes)) {
            String extractedText = new PDFTextStripper().getText(document);
            assertTrue(extractedText.contains("Benjamin"));
            assertTrue(extractedText.contains("AWARESPAN"));
        }
    }

    @Test
    void linkedInTokensAreEncryptedAtRestAndCanBeDecrypted() {
        var registration = clientRegistrations.findByRegistrationId("linkedin-publisher");
        Instant issued = Instant.now();
        var accessToken = new OAuth2AccessToken(OAuth2AccessToken.TokenType.BEARER, "access-token-test-secret", issued,
            issued.plusSeconds(3600), Set.of("openid", "profile", "email", "w_member_social"));
        var refreshToken = new OAuth2RefreshToken("refresh-token-test-secret", issued);
        var client = new OAuth2AuthorizedClient(registration, "linkedin-encryption-test", accessToken, refreshToken);
        authorizedClients.saveAuthorizedClient(client, new UsernamePasswordAuthenticationToken("linkedin-encryption-test", ""));

        Map<String, Object> stored = jdbc.queryForMap("SELECT access_token_ciphertext, refresh_token_ciphertext FROM linkedin_authorized_clients WHERE principal_name = ?", "linkedin-encryption-test");
        String encryptedBytes = new String((byte[]) stored.get("access_token_ciphertext"), StandardCharsets.UTF_8);
        assertFalse(encryptedBytes.contains("access-token-test-secret"));

        OAuth2AuthorizedClient restored = authorizedClients.loadAuthorizedClient("linkedin-publisher", "linkedin-encryption-test");
        assertEquals("access-token-test-secret", restored.getAccessToken().getTokenValue());
        assertEquals("refresh-token-test-secret", restored.getRefreshToken().getTokenValue());
        authorizedClients.removeAuthorizedClient("linkedin-publisher", "linkedin-encryption-test");
    }

    @Test
    void linkedinDraftMustBeApprovedBeforePublishCanProceed() {
        OidcUser actor = mock(OidcUser.class);
        when(actor.getName()).thenReturn("linkedin-review-test");
        when(actor.getSubject()).thenReturn("linkedin-review-test");
        var registration = clientRegistrations.findByRegistrationId("linkedin-publisher");
        Instant issued = Instant.now();
        var accessToken = new OAuth2AccessToken(OAuth2AccessToken.TokenType.BEARER, "review-test-access-token", issued,
            issued.plusSeconds(3600), Set.of("openid", "profile", "email", "w_member_social"));
        authorizedClients.saveAuthorizedClient(new OAuth2AuthorizedClient(registration, actor.getName(), accessToken),
            new UsernamePasswordAuthenticationToken(actor.getName(), ""));

        Map<String, Object> draft = linkedInPublishing.createDraft("A post awaiting owner review.", actor);
        UUID draftId = (UUID) draft.get("id");
        assertEquals("PENDING_REVIEW", draft.get("status"));
        assertThrows(IllegalStateException.class, () -> linkedInPublishing.publish(draftId, actor));
        Map<String, Object> approved = linkedInPublishing.review(draftId, true, actor);
        assertEquals("APPROVED", approved.get("status"));
        authorizedClients.removeAuthorizedClient("linkedin-publisher", actor.getName());
    }

    @Test
    void adminContentApiIsNotPublic() throws Exception {
        mockMvc.perform(get("/api/v1/admin/content/projects"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void agentRestAndMcpRequireBearerTokens() throws Exception {
        mockMvc.perform(get("/api/v1/agent/projects"))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/mcp").contentType(MediaType.APPLICATION_JSON)
            .content("{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void scopedAgentTokenCanReadAndUseMcpTools() throws Exception {
        var token = agentTokens.create("integration-reader", Set.of("portfolio:read"), 1, "integration-test");
        assertNotNull(agentTokens.authenticate(token.token()));
        mockMvc.perform(get("/api/v1/agent/projects").header("Authorization", "Bearer " + token.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].slug").value("awarespan"));
        mockMvc.perform(post("/mcp").header("Authorization", "Bearer " + token.token())
            .header("Accept", "application/json, text/event-stream")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.result.protocolVersion").value("2025-03-26"));
        mockMvc.perform(post("/api/v1/agent/proposals")
            .header("Authorization", "Bearer " + token.token())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"resource\":\"projects\",\"operation\":\"CREATE\",\"payload\":{\"name\":\"nope\"}}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void currentMcpProtocolUsesScopedToolsAndStandardHeaders() throws Exception {
        var token = agentTokens.create("integration-mcp", Set.of("portfolio:read"), 1, "integration-test");
        String metadata = "\"_meta\":{\"io.modelcontextprotocol/protocolVersion\":\"2026-07-28\",\"io.modelcontextprotocol/clientInfo\":{\"name\":\"integration-test\",\"version\":\"1\"},\"io.modelcontextprotocol/clientCapabilities\":{}}";
        mockMvc.perform(post("/mcp")
            .header("Authorization", "Bearer " + token.token())
            .header("MCP-Protocol-Version", "2026-07-28")
            .header("Mcp-Method", "tools/list")
            .header("Accept", "application/json, text/event-stream")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\",\"params\":{" + metadata + "}}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.result.tools[0].name").value("portfolio_get_profile"));
        mockMvc.perform(post("/mcp")
            .header("Authorization", "Bearer " + token.token())
            .header("MCP-Protocol-Version", "2026-07-28")
            .header("Mcp-Method", "tools/call")
            .header("Mcp-Name", "portfolio_get_profile")
            .header("Accept", "application/json, text/event-stream")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{" + metadata + ",\"name\":\"portfolio_get_profile\",\"arguments\":{}}}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.result.structuredContent.full_name").value("Benjamin"));
    }

    @Test
    void agentChangesBecomeReviewProposalsRatherThanDirectWrites() throws Exception {
        var token = agentTokens.create("integration-proposer", Set.of("portfolio:propose"), 1, "integration-test");
        mockMvc.perform(post("/api/v1/agent/proposals")
            .header("Authorization", "Bearer " + token.token())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"resource\":\"projects\",\"operation\":\"UPDATE\",\"targetId\":\"00000000-0000-0000-0000-000000000001\",\"payload\":{\"summary\":\"Proposed summary\"}}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PENDING_REVIEW"));
    }

    @Test
    void revokedAgentTokenImmediatelyLosesAccess() throws Exception {
        var token = agentTokens.create("revocation-test", Set.of("portfolio:read"), 1, "integration-test");
        agentTokens.revoke(token.id());
        mockMvc.perform(get("/api/v1/agent/projects").header("Authorization", "Bearer " + token.token()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void linkedInDraftQueueIsNotPublic() throws Exception {
        mockMvc.perform(get("/api/v1/admin/linkedin/drafts"))
            .andExpect(status().isUnauthorized());
    }
}
