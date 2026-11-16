package in.bchbenjamin.portfolio.agent;

import java.io.IOException;
import java.util.ArrayList;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AgentTokenAuthenticationFilter extends OncePerRequestFilter {
    private final AgentTokenService tokens;

    public AgentTokenAuthenticationFilter(AgentTokenService tokens) { this.tokens = tokens; }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        return !path.startsWith("/api/v1/agent/") && !path.equals("/mcp");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        var currentAuthentication = SecurityContextHolder.getContext().getAuthentication();
        boolean anonymous = currentAuthentication == null || currentAuthentication instanceof org.springframework.security.authentication.AnonymousAuthenticationToken;
        if (header != null && header.startsWith("Bearer ") && anonymous) {
            AgentTokenService.AgentIdentity identity = tokens.authenticate(header.substring(7).trim());
            if (identity != null) {
                var authorities = new ArrayList<SimpleGrantedAuthority>();
                authorities.add(new SimpleGrantedAuthority("ROLE_AGENT"));
                identity.scopes().forEach(scope -> authorities.add(new SimpleGrantedAuthority("SCOPE_" + scope)));
                var authentication = new UsernamePasswordAuthenticationToken(identity.name(), null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                request.setAttribute("agentIdentity", identity);
            }
        }
        chain.doFilter(request, response);
    }
}
