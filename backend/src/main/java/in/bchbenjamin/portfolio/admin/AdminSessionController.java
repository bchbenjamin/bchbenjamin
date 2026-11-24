package in.bchbenjamin.portfolio.admin;

import in.bchbenjamin.portfolio.security.OwnerTotpService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminSessionController {
    private final OwnerTotpService totp;

    public AdminSessionController(OwnerTotpService totp) {
        this.totp = totp;
    }

    @GetMapping("/session")
    public Map<String, Object> session(@AuthenticationPrincipal OidcUser user, HttpServletRequest request) {
        return Map.of(
            "authenticated", true,
            "name", user.getFullName() == null ? "" : user.getFullName(),
            "email", user.getEmail() == null ? "" : user.getEmail(),
            "issuer", user.getIssuer().toString(),
            "totpConfigured", totp.isEnabled(user.getIssuer().toString(), user.getSubject()),
            "stepUp", AdminTotpController.isElevated(request.getSession(false))
        );
    }
}
