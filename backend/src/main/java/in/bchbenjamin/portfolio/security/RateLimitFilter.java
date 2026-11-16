package in.bchbenjamin.portfolio.security;

import in.bchbenjamin.portfolio.agent.AgentTokenService.AgentIdentity;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private static final long WINDOW_NANOS = 60_000_000_000L;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final int publicLimit;
    private final int agentLimit;
    private final int adminLimit;
    private final int defaultLimit;

    public RateLimitFilter(
        @Value("${app.rate-limit.public-per-minute:120}") int publicLimit,
        @Value("${app.rate-limit.agent-per-minute:60}") int agentLimit,
        @Value("${app.rate-limit.admin-per-minute:120}") int adminLimit,
        @Value("${app.rate-limit.default-per-minute:60}") int defaultLimit
    ) {
        this.publicLimit = publicLimit;
        this.agentLimit = agentLimit;
        this.adminLimit = adminLimit;
        this.defaultLimit = defaultLimit;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
            || request.getRequestURI().substring(request.getContextPath().length()).startsWith("/actuator/health");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        AgentIdentity agent = request.getAttribute("agentIdentity") instanceof AgentIdentity identity ? identity : null;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean authenticatedUser = authentication != null && authentication.isAuthenticated()
            && !(authentication instanceof AnonymousAuthenticationToken);
        int limit;
        String key;
        if (agent != null || path.startsWith("/api/v1/agent/") || "/mcp".equals(path)) {
            limit = agentLimit;
            key = agent == null ? "agent-ip:" + request.getRemoteAddr() : "agent:" + agent.id();
        } else if (path.startsWith("/api/v1/admin/")) {
            limit = adminLimit;
            key = authenticatedUser ? "admin:" + authentication.getName() : "admin-ip:" + request.getRemoteAddr();
        } else if (path.startsWith("/api/v1/public/")) {
            limit = publicLimit;
            key = "public-ip:" + request.getRemoteAddr();
        } else {
            limit = defaultLimit;
            key = "default-ip:" + request.getRemoteAddr();
        }

        long now = System.nanoTime();
        AtomicBoolean allowed = new AtomicBoolean(true);
        AtomicInteger remaining = new AtomicInteger();
        windows.compute(key, (ignored, current) -> {
            if (current == null || now - current.startedAtNanos() >= WINDOW_NANOS) {
                remaining.set(limit - 1);
                return new Window(now, 1);
            }
            if (current.count() >= limit) {
                allowed.set(false);
                remaining.set(0);
                return current;
            }
            int count = current.count() + 1;
            remaining.set(Math.max(0, limit - count));
            return new Window(current.startedAtNanos(), count);
        });

        if (windows.size() > 10_000) {
            long cutoff = now - (2 * WINDOW_NANOS);
            windows.entrySet().removeIf(entry -> now - entry.getValue().startedAtNanos() > (2 * WINDOW_NANOS) || entry.getValue().startedAtNanos() < cutoff);
        }

        response.setHeader("X-RateLimit-Limit", Integer.toString(limit));
        response.setHeader("X-RateLimit-Remaining", Integer.toString(remaining.get()));
        if (!allowed.get()) {
            Window current = windows.get(key);
            long retrySeconds = current == null ? 60 : Math.max(1, (current.startedAtNanos() + WINDOW_NANOS - now + 999_999_999L) / 1_000_000_000L);
            response.setStatus(429);
            response.setHeader("Retry-After", Long.toString(retrySeconds));
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"rate_limited\",\"retryAfterSeconds\":" + retrySeconds + "}");
            return;
        }
        chain.doFilter(request, response);
    }

    private record Window(long startedAtNanos, int count) { }
}
