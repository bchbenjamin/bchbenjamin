package in.bchbenjamin.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
    "spring.jpa.hibernate.ddl-auto=none"
})
@AutoConfigureMockMvc
class PortfolioApiApplicationTest {
    @Autowired private MockMvc mockMvc;

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
            .andExpect(status().is3xxRedirection());
    }

    @Test
    void csrfBootstrapIsPublic() throws Exception {
        mockMvc.perform(get("/api/v1/csrf"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.headerName").value("X-XSRF-TOKEN"))
            .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void googleLoginUsesAuthorizationCodeAndPkce() throws Exception {
        mockMvc.perform(get("/oauth2/authorization/google"))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location", containsString("code_challenge=")))
            .andExpect(header().string("Location", containsString("response_type=code")));
    }
}
