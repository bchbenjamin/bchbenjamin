package in.bchbenjamin.portfolio.admin;

import in.bchbenjamin.portfolio.security.OwnerTotpService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/admin/totp")
public class AdminTotpController {
    public static final String STEP_UP_UNTIL = "ADMIN_TOTP_STEP_UP_UNTIL";
    private final OwnerTotpService totp;
    private final AdminAuditService audit;
    public AdminTotpController(OwnerTotpService totp, AdminAuditService audit) { this.totp = totp; this.audit = audit; }

    @GetMapping("/status")
    public Map<String, Object> status(@AuthenticationPrincipal OidcUser user, HttpServletRequest request) {
        return Map.of("configured", totp.isEnabled(user.getIssuer().toString(), user.getSubject()), "stepUp", isElevated(request.getSession(false)));
    }

    @PostMapping("/enroll")
    public Map<String, String> enroll(@AuthenticationPrincipal OidcUser user, HttpServletRequest request) {
        String issuer = user.getIssuer().toString();
        if (totp.isEnabled(issuer, user.getSubject()) && !isElevated(request.getSession(false))) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Verify the existing authenticator before replacing it.");
        var enrollment = totp.beginEnrollment(issuer, user.getSubject(), user.getEmail() == null ? user.getSubject() : user.getEmail(), isElevated(request.getSession(false)));
        audit.record(user, "TOTP_ENROLLMENT_STARTED", "admin-totp", null);
        return Map.of("secret", enrollment.secret(), "otpauthUri", enrollment.otpauthUri());
    }

    @PostMapping("/confirm")
    public Map<String, Object> confirm(@AuthenticationPrincipal OidcUser user, @RequestBody CodeRequest body, HttpServletRequest request) {
        if (!totp.confirmEnrollment(user.getIssuer().toString(), user.getSubject(), body.code())) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "That code is invalid or expired. Try the current code from your authenticator.");
        elevate(request); audit.record(user, "TOTP_ENROLLED", "admin-totp", null);
        return Map.of("verified", true, "expiresInSeconds", 600);
    }

    @PostMapping("/verify")
    public Map<String, Object> verify(@AuthenticationPrincipal OidcUser user, @RequestBody CodeRequest body, HttpServletRequest request) {
        if (!totp.verifyAndConsume(user.getIssuer().toString(), user.getSubject(), body.code())) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "That code is invalid or expired. Try again.");
        elevate(request); audit.record(user, "TOTP_STEP_UP", "admin-session", null);
        return Map.of("verified", true, "expiresInSeconds", 600);
    }

    public static boolean isElevated(HttpSession session) {
        Object value = session == null ? null : session.getAttribute(STEP_UP_UNTIL);
        return value instanceof Instant expiry && expiry.isAfter(Instant.now());
    }
    private static void elevate(HttpServletRequest request) {
        request.getSession(true);
        request.changeSessionId();
        request.getSession(false).setAttribute(STEP_UP_UNTIL, Instant.now().plusSeconds(600));
    }
    public record CodeRequest(String code) { }
}
