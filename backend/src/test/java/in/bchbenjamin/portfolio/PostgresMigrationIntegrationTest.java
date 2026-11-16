package in.bchbenjamin.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import in.bchbenjamin.portfolio.agent.AgentTokenService;
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
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private AgentTokenService agentTokens;

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
    }

    @Test
    void adminContentApiIsNotPublic() throws Exception {
        mockMvc.perform(get("/api/v1/admin/content/projects"))
            .andExpect(status().is3xxRedirection());
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
        mockMvc.perform(get("/api/v1/agent/projects").header("Authorization", "Bearer " + token.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].slug").value("awarespan"));
        mockMvc.perform(post("/mcp").header("Authorization", "Bearer " + token.token())
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
            .andExpect(status().is3xxRedirection());
    }
}
