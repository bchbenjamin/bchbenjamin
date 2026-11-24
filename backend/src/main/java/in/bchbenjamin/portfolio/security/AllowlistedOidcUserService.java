package in.bchbenjamin.portfolio.security;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Service
public class AllowlistedOidcUserService extends OidcUserService {
    private final Set<String> allowedSubjects;

    public AllowlistedOidcUserService(@Value("${app.security.admin-subjects:}") String configuredSubjects) {
        this.allowedSubjects = Arrays.stream(configuredSubjects.split(","))
            .map(String::trim)
            .filter(value -> !value.isBlank())
            .collect(Collectors.toUnmodifiableSet());
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser user = super.loadUser(userRequest);
        String issuer = user.getIssuer().toString().replaceAll("/$", "");
        String subjectIdentity = issuer + "|" + user.getSubject();
        String email = user.getAttribute("email");
        boolean verifiedEmail = Boolean.TRUE.equals(user.getAttribute("email_verified"));
        String verifiedEmailIdentity = email == null ? "" : issuer + "|" + email.trim().toLowerCase(java.util.Locale.ROOT);
        // Prefer Google's immutable OIDC subject; permit an explicitly allowlisted, verified email
        // so the owner can bootstrap the first login before the subject claim is known.
        if (!allowedSubjects.contains(subjectIdentity)
                && !(verifiedEmail && allowedSubjects.contains(verifiedEmailIdentity))) {
            throw new OAuth2AuthenticationException(
                new OAuth2Error("access_denied", "This identity is not authorized for portfolio administration.", null));
        }
        Set<GrantedAuthority> authorities = new HashSet<>(user.getAuthorities());
        authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        return new DefaultOidcUser(authorities, user.getIdToken(), user.getUserInfo(), "sub");
    }
}
