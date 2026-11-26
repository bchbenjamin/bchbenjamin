package in.bchbenjamin.portfolio.security;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.authorization.AuthorizationDecision;
import java.time.Instant;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.http.HttpStatus;
import in.bchbenjamin.portfolio.agent.AgentTokenAuthenticationFilter;
import org.springframework.security.web.authentication.logout.HeaderWriterLogoutHandler;
import org.springframework.security.web.header.writers.ClearSiteDataHeaderWriter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    FilterRegistrationBean<AgentTokenAuthenticationFilter> agentTokenFilterRegistration(AgentTokenAuthenticationFilter filter) {
        FilterRegistrationBean<AgentTokenAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(RateLimitFilter filter) {
        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        AllowlistedOidcUserService oidcUserService,
        ClientRegistrationRepository registrations,
        AgentTokenAuthenticationFilter agentTokenFilter,
        RateLimitFilter rateLimitFilter,
        @Value("${app.frontend-url:https://www.bchbenjamin.in}") String frontendUrl
    ) throws Exception {
        var resolver = new DefaultOAuth2AuthorizationRequestResolver(
            registrations, OAuth2AuthorizationRequestRedirectFilter.DEFAULT_AUTHORIZATION_REQUEST_BASE_URI);
        resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());

        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringRequestMatchers("/api/v1/agent/**", "/mcp", "/api/v1/public/contact/**", "/api/v1/public/analytics", "/api/v1/internal/maintenance"))
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .sessionFixation(fixation -> fixation.migrateSession()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/health", "/api/v1/csrf", "/actuator/health/**", "/oauth2/**", "/login/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/public/**").permitAll()
                .requestMatchers("/api/v1/agent/**", "/mcp").denyAll() // MCP remains intentionally disabled pending a separate security review.
                .requestMatchers(HttpMethod.POST, "/api/v1/public/contact/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/public/analytics").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/internal/maintenance").permitAll()
                .requestMatchers("/api/v1/admin/session", "/api/v1/admin/totp/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/admin/**").access((authentication, context) -> {
                    var principal = authentication.get();
                    var session = context.getRequest().getSession(false);
                    Object expiry = session == null ? null : session.getAttribute(in.bchbenjamin.portfolio.admin.AdminTotpController.STEP_UP_UNTIL);
                    boolean elevated = expiry instanceof Instant instant && instant.isAfter(Instant.now());
                    boolean owner = principal != null && principal.isAuthenticated() && principal.getAuthorities().stream().anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
                    return new AuthorizationDecision(owner && elevated);
                })
                .anyRequest().denyAll())
            .exceptionHandling(exceptions -> exceptions
                .defaultAuthenticationEntryPointFor(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED), new AntPathRequestMatcher("/api/v1/agent/**"))
                .defaultAuthenticationEntryPointFor(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED), new AntPathRequestMatcher("/mcp")))
            .addFilterBefore(agentTokenFilter, AnonymousAuthenticationFilter.class)
            .addFilterAfter(rateLimitFilter, AgentTokenAuthenticationFilter.class)
            .oauth2Login(oauth -> oauth
                .authorizationEndpoint(endpoint -> endpoint.authorizationRequestResolver(resolver))
                .userInfoEndpoint(userInfo -> userInfo.oidcUserService(oidcUserService))
                .defaultSuccessUrl(frontendUrl + "/admin", true))
            .logout(logout -> logout
                .logoutUrl("/logout")
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("__Host-PORTFOLIO_SESSION", "JSESSIONID", "XSRF-TOKEN")
                .addLogoutHandler(new HeaderWriterLogoutHandler(new ClearSiteDataHeaderWriter(ClearSiteDataHeaderWriter.Directive.CACHE, ClearSiteDataHeaderWriter.Directive.COOKIES, ClearSiteDataHeaderWriter.Directive.STORAGE)))
                .logoutSuccessUrl(frontendUrl + "/login?logged_out"))
            .headers(headers -> headers
                .contentTypeOptions(Customizer.withDefaults())
                .frameOptions(frame -> frame.deny())
                .cacheControl(Customizer.withDefaults())
                .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'; base-uri 'none'"))
                .referrerPolicy(referrer -> referrer.policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .addHeaderWriter(new org.springframework.security.web.header.writers.StaticHeadersWriter("Permissions-Policy", "camera=(), microphone=(), geolocation=()"))
                .addHeaderWriter(new org.springframework.security.web.header.writers.StaticHeadersWriter("Cross-Origin-Opener-Policy", "same-origin"))
                .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31_536_000)));
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
        @Value("${app.security.allowed-origins:https://www.bchbenjamin.in,https://bchbenjamin.in,http://localhost:3000}") String origins
    ) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).filter(value -> !value.isBlank()).toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Accept", "Content-Type", "X-XSRF-TOKEN", "Authorization", "MCP-Protocol-Version", "Mcp-Method", "Mcp-Name"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        configuration.setExposedHeaders(List.of("X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
