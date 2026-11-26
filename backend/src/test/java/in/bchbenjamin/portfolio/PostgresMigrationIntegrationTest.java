package in.bchbenjamin.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import in.bchbenjamin.portfolio.agent.AgentTokenService;
import in.bchbenjamin.portfolio.linkedin.LinkedInPublishingService;
import in.bchbenjamin.portfolio.resume.ResumePdfService;
import in.bchbenjamin.portfolio.resume.ResumeGenerationService;
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
    @Autowired private ResumePdfService resumePdfService;
    @Autowired private ResumeGenerationService resumeGenerationService;

    @Test
    void flywayCreatesThePortfolioSchemaAndSeedData() throws Exception {
        mockMvc.perform(get("/api/v1/public/projects"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(7))
            .andExpect(jsonPath("$[0].slug").value("ease-health"));
        mockMvc.perform(get("/api/v1/public/profile"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fullName").value("B C H Benjamin"));
    }

    @Test
    void anonymousAnalyticsPersistsVisitsAndHonoursOptOut() throws Exception {
        String source = "integration-" + UUID.randomUUID();
        String body = "{\"event\":\"visit\",\"source\":\"" + source + "\",\"model\":\"Test device\"}";
        mockMvc.perform(post("/api/v1/public/analytics")
                .header("Origin", "https://www.bchbenjamin.in")
                .header("Sec-GPC", "1")
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isNoContent());
        assertEquals(0L, jdbc.queryForObject("SELECT count(*) FROM portfolio_analytics WHERE source=?", Long.class, source));
        mockMvc.perform(post("/api/v1/public/analytics")
                .header("Origin", "https://www.bchbenjamin.in")
                .header("x-vercel-ip-country", "IN")
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isNoContent());
        assertEquals(1L, jdbc.queryForObject("SELECT sum(visits) FROM portfolio_analytics WHERE source=? AND country='IN' AND model='Test device'", Long.class, source));
        mockMvc.perform(get("/api/v1/admin/analytics")).andExpect(status().isUnauthorized());
    }

    @Test
    void jdbcSessionMigrationCreatesPersistentSessionTables() {
        assertNotNull(jdbc.queryForObject("SELECT COUNT(*) FROM SPRING_SESSION", Long.class));
        assertNotNull(jdbc.queryForObject("SELECT COUNT(*) FROM SPRING_SESSION_ATTRIBUTES", Long.class));
    }

    @Test
    void contactMigrationCreatesTheModerationAndVerificationQueue() {
        assertEquals(0L, jdbc.queryForObject("SELECT COUNT(*) FROM contact_submissions", Long.class));
    }

    @Test
    void resumePdfIsNeverPublicAndPrivateAdminEndpointRequiresOwnerSession() throws Exception {
        mockMvc.perform(get("/api/v1/public/resume.pdf?variant=resume"))
            .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/admin/resumes"))
            .andExpect(status().isUnauthorized());

        byte[] bytes = resumePdfService.render("resume");
        assertTrue(bytes.length > 500);
        assertTrue(new String(bytes, 0, 4).equals("%PDF"));
        try (var document = PDDocument.load(bytes)) {
            String extractedText = new PDFTextStripper().getText(document);
            assertTrue(extractedText.contains("B C H Benjamin"));
            assertTrue(extractedText.contains("Ease Health"));
            assertFalse(extractedText.contains("AWARESPAN"));
        }
    }

    @Test
    void publicProjectProjectionNeverExposesResumeOnlyOrStorageMetadata() throws Exception {
        mockMvc.perform(get("/api/v1/public/projects"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].resumeDescription").doesNotExist())
            .andExpect(jsonPath("$[0].customFields").doesNotExist())
            .andExpect(jsonPath("$[0].publicFields").doesNotExist())
            .andExpect(jsonPath("$[0].resumeIncluded").doesNotExist())
            .andExpect(jsonPath("$[0].resume_included").doesNotExist());
    }

    @Test
    void resumeGeneratorUsesOnlyCuratedRecordsForGeneralAndJobSpecificPdfs() throws Exception {
        var general = resumeGenerationService.generate("general", null, "ats");
        assertEquals("GENERAL", general.mode());
        byte[] generalPdf = resumeGenerationService.download(general.id());
        try (var document = PDDocument.load(generalPdf)) {
            String extracted = new PDFTextStripper().getText(document);
            assertTrue(extracted.contains("B C H Benjamin"));
            assertTrue(extracted.contains("Ease Health"));
            assertTrue(extracted.contains("FOSSEE"));
            assertFalse(extracted.contains("AWARESPAN"));
        }

        String jobDescription = "Build healthcare appointment scheduling software with Python FastAPI, MySQL, bcrypt authentication and natural-language booking using Groq or LLaMA 3. Deliver patient and doctor workflows.";
        var tailored = resumeGenerationService.generate("job", jobDescription, "ats");
        assertEquals("JOB_DESCRIPTION", tailored.mode());
        assertFalse(tailored.matchReport().get("projects") == null);
        assertFalse(((java.util.List<?>) tailored.matchReport().get("projects")).isEmpty());
        byte[] tailoredPdf = resumeGenerationService.download(tailored.id());
        try (var document = PDDocument.load(tailoredPdf)) {
            String extracted = new PDFTextStripper().getText(document);
            assertTrue(extracted.contains("Ease Health"));
            var selectedProjectNames = ((java.util.List<?>) tailored.matchReport().get("projects")).stream()
                .map(String::valueOf).map(id -> jdbc.queryForObject("SELECT name FROM projects WHERE id = ?::uuid", String.class, id)).toList();
            var selectedExperienceNames = ((java.util.List<?>) tailored.matchReport().get("experience")).stream()
                .map(String::valueOf).map(id -> jdbc.queryForObject("SELECT role_title FROM experience WHERE id = ?::uuid", String.class, id)).toList();
            assertFalse(extracted.contains("Breach & Defend"), "selected projects=" + selectedProjectNames + "; selected experience=" + selectedExperienceNames);
        }
        resumeGenerationService.delete(general.id());
        resumeGenerationService.delete(tailored.id());
    }

    @Test
    void publicMediaRouteDoesNotRevealPrivateAssets() throws Exception {
        UUID id = jdbc.queryForObject("""
            INSERT INTO media_assets (original_filename, content_type, byte_size, visibility, file_bytes, uploaded_by)
            VALUES ('private.png', 'image/png', 8, 'PRIVATE', decode('89504e470d0a1a0a', 'hex'), 'integration-test') RETURNING id
            """, UUID.class);
        mockMvc.perform(get("/api/v1/public/media/" + id)).andExpect(status().isNotFound());
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
    void scopedAgentTokenCannotAccessDisabledAgentOrMcpRoutes() throws Exception {
        var token = agentTokens.create("integration-reader", Set.of("portfolio:read"), 1, "integration-test");
        assertNotNull(agentTokens.authenticate(token.token()));
        mockMvc.perform(get("/api/v1/agent/projects").header("Authorization", "Bearer " + token.token()))
            .andExpect(status().isForbidden());
        mockMvc.perform(post("/mcp").header("Authorization", "Bearer " + token.token())
            .header("Accept", "application/json, text/event-stream")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\"}"))
            .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/agent/proposals")
            .header("Authorization", "Bearer " + token.token())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"resource\":\"projects\",\"operation\":\"CREATE\",\"payload\":{\"name\":\"nope\"}}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void currentMcpProtocolIsRejectedWhileMcpIsDisabled() throws Exception {
        var token = agentTokens.create("integration-mcp", Set.of("portfolio:read"), 1, "integration-test");
        String metadata = "\"_meta\":{\"io.modelcontextprotocol/protocolVersion\":\"2026-07-28\",\"io.modelcontextprotocol/clientInfo\":{\"name\":\"integration-test\",\"version\":\"1\"},\"io.modelcontextprotocol/clientCapabilities\":{}}";
        mockMvc.perform(post("/mcp")
            .header("Authorization", "Bearer " + token.token())
            .header("MCP-Protocol-Version", "2026-07-28")
            .header("Mcp-Method", "tools/list")
            .header("Accept", "application/json, text/event-stream")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\",\"params\":{" + metadata + "}}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void agentChangesCannotBeSubmittedWhileAgentAccessIsDisabled() throws Exception {
        var token = agentTokens.create("integration-proposer", Set.of("portfolio:propose"), 1, "integration-test");
        mockMvc.perform(post("/api/v1/agent/proposals")
            .header("Authorization", "Bearer " + token.token())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"resource\":\"projects\",\"operation\":\"UPDATE\",\"targetId\":\"00000000-0000-0000-0000-000000000001\",\"payload\":{\"summary\":\"Proposed summary\"}}"))
            .andExpect(status().isForbidden());
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
