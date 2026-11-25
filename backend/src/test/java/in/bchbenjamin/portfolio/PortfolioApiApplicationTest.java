package in.bchbenjamin.portfolio;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:portfolio;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=none",
    "app.contact.maintenance-enabled=false",
    "spring.session.jdbc.initialize-schema=never"
})
@AutoConfigureMockMvc
class PortfolioApiApplicationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbc;

    @BeforeEach
    void createJdbcSessionTablesForH2() {
        jdbc.execute("CREATE TABLE IF NOT EXISTS SPRING_SESSION (PRIMARY_ID CHAR(36) NOT NULL PRIMARY KEY, SESSION_ID CHAR(36) NOT NULL UNIQUE, CREATION_TIME BIGINT NOT NULL, LAST_ACCESS_TIME BIGINT NOT NULL, MAX_INACTIVE_INTERVAL INT NOT NULL, EXPIRY_TIME BIGINT NOT NULL, PRINCIPAL_NAME VARCHAR(100))");
        jdbc.execute("CREATE TABLE IF NOT EXISTS SPRING_SESSION_ATTRIBUTES (SESSION_PRIMARY_ID CHAR(36) NOT NULL, ATTRIBUTE_NAME VARCHAR(200) NOT NULL, ATTRIBUTE_BYTES BYTEA NOT NULL, PRIMARY KEY (SESSION_PRIMARY_ID, ATTRIBUTE_NAME), FOREIGN KEY (SESSION_PRIMARY_ID) REFERENCES SPRING_SESSION(PRIMARY_ID) ON DELETE CASCADE)");
    }

    @Test
    void healthEndpointReturnsServiceStatus() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ok"))
            .andExpect(jsonPath("$.service").value("portfolio-api"));
    }

    @Test
    void administrativeSessionRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/admin/session"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void launcherLayoutConfigurationRequiresAuthenticatedOwner() throws Exception {
        mockMvc.perform(get("/api/v1/admin/site-configuration"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void mediaLibraryRequiresAuthenticatedOwner() throws Exception {
        mockMvc.perform(get("/api/v1/admin/media"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void launcherLayoutWriteRejectsAnonymousAndSpoofedIdentityHeaders() throws Exception {
        mockMvc.perform(put("/api/v1/admin/site-configuration/launcher-layout")
                .header("X-Role", "ADMIN")
                .header("X-Forwarded-User", "owner@example.com")
                .header("X-Auth-Request-Email", "owner@example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"icons\":{},\"widgets\":{}}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void csrfBootstrapIsPublic() throws Exception {
        mockMvc.perform(get("/api/v1/csrf"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.headerName").value("X-XSRF-TOKEN"))
            .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void contactEndpointRejectsInvalidSubmissionBeforePersistence() throws Exception {
        mockMvc.perform(post("/api/v1/public/contact")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"\",\"email\":\"not-an-email\",\"subject\":\"x\",\"message\":\"short\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void googleLoginUsesAuthorizationCodeAndPkce() throws Exception {
        mockMvc.perform(get("/oauth2/authorization/google"))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location", containsString("code_challenge=")))
            .andExpect(header().string("Location", containsString("response_type=code")));
    }
}
