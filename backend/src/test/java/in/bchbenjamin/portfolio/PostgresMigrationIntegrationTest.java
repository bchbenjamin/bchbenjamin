package in.bchbenjamin.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
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
    void linkedInDraftQueueIsNotPublic() throws Exception {
        mockMvc.perform(get("/api/v1/admin/linkedin/drafts"))
            .andExpect(status().is3xxRedirection());
    }
}
