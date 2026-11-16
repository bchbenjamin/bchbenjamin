package in.bchbenjamin.portfolio.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import static org.junit.jupiter.api.Assertions.assertEquals;

class RateLimitFilterTest {
    @Test
    void appliesFixedWindowLimitAndReturnsRetryAfter() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(2, 2, 2, 2, 2);
        for (int i = 0; i < 2; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/public/projects");
            request.setServletPath("/api/v1/public/projects");
            request.setRemoteAddr("192.0.2.10");
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(request, response, new MockFilterChain());
            assertEquals(200, response.getStatus());
        }
        MockHttpServletRequest limitedRequest = new MockHttpServletRequest("GET", "/api/v1/public/projects");
        limitedRequest.setServletPath("/api/v1/public/projects");
        limitedRequest.setRemoteAddr("192.0.2.10");
        MockHttpServletResponse limitedResponse = new MockHttpServletResponse();
        filter.doFilter(limitedRequest, limitedResponse, new MockFilterChain());
        assertEquals(429, limitedResponse.getStatus());
        assertEquals("60", limitedResponse.getHeader("Retry-After"));
    }
}
