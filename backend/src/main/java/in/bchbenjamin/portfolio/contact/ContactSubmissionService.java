package in.bchbenjamin.portfolio.contact;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ContactSubmissionService {
    private final JdbcTemplate jdbc;
    private final ContactModerationService moderation;
    private final ContactMailService mail;
    private final String ipSalt;
    private final SecureRandom random = new SecureRandom();

    public ContactSubmissionService(JdbcTemplate jdbc, ContactModerationService moderation, ContactMailService mail,
        @Value("${app.contact.ip-hash-salt:}") String ipSalt) {
        this.jdbc = jdbc;
        this.moderation = moderation;
        this.mail = mail;
        this.ipSalt = ipSalt == null ? "" : ipSalt;
    }

    public SubmissionResult submit(ContactRequest request, String remoteAddress, String userAgent) {
        if (request.website() != null && !request.website().isBlank()) return new SubmissionResult("accepted", null);
        ContactModerationService.Assessment assessment = moderation.assess(request);
        UUID id = UUID.randomUUID();
        byte[] tokenBytes = new byte[32];
        random.nextBytes(tokenBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        String tokenHash = sha256(rawToken);
        String status = assessment.decision().equals("REJECT") ? "REJECTED"
            : assessment.decision().equals("APPROVE") ? "PENDING_EMAIL_VERIFICATION" : "PENDING_REVIEW";
        jdbc.update("""
            INSERT INTO contact_submissions (id, sender_name, organization, sender_email, subject, message,
                ai_decision, ai_confidence, ai_risk_score, ai_identity_assessment, ai_reason, status,
                verification_token_hash, verification_expires_at, ip_hash, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, id, request.name().trim(), blankToNull(request.organization()), request.email().trim().toLowerCase(),
            request.subject().trim(), request.message().trim(), assessment.decision(), assessment.confidence(),
            assessment.riskScore(), assessment.identityAssessment(), assessment.reason(), status,
            assessment.decision().equals("REJECT") ? null : tokenHash,
            assessment.decision().equals("REJECT") ? null : Timestamp.from(Instant.now().plusSeconds(86400)),
            hashIp(remoteAddress), truncate(userAgent, 500));

        if (!assessment.decision().equals("REJECT")) {
            try {
                mail.sendVerification(request.email().trim(), request.name().trim(), rawToken);
            } catch (Exception exception) {
                jdbc.update("UPDATE contact_submissions SET status = 'VERIFICATION_FAILED', notification_error = ?, updated_at = now() WHERE id = ?",
                    "Verification email could not be sent; owner intervention is required.", id);
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Email verification is temporarily unavailable");
            }
        }
        return new SubmissionResult("accepted", id);
    }

    public VerificationResult verify(String rawToken) {
        if (rawToken == null || rawToken.length() < 32 || rawToken.length() > 128)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification link is invalid or expired");
        List<Map<String, Object>> rows = jdbc.queryForList("""
            UPDATE contact_submissions
            SET email_verified_at = now(), verification_token_hash = NULL, verification_expires_at = NULL,
                status = CASE WHEN ai_decision = 'APPROVE' THEN 'APPROVED' ELSE 'PENDING_REVIEW' END,
                updated_at = now()
            WHERE verification_token_hash = ? AND verification_expires_at > now()
              AND email_verified_at IS NULL AND status IN ('PENDING_EMAIL_VERIFICATION', 'PENDING_REVIEW')
            RETURNING id, status
            """, sha256(rawToken));
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.GONE, "Verification link is invalid or expired");
        UUID id = (UUID) rows.get(0).get("id");
        if ("APPROVED".equals(rows.get(0).get("status"))) notifyOwner(id);
        return new VerificationResult(id, currentStatus(id));
    }

    public Map<String, Object> resendVerification(UUID id) {
        Map<String, Object> row = find(id);
        if (row.get("email_verified_at") != null || "REJECT".equals(row.get("ai_decision")))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This submission does not require email verification");
        if (!List.of("VERIFICATION_FAILED", "PENDING_EMAIL_VERIFICATION", "PENDING_REVIEW").contains(row.get("status")))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This submission is not awaiting email verification");
        byte[] tokenBytes = new byte[32];
        random.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        String status = "APPROVE".equals(row.get("ai_decision")) ? "PENDING_EMAIL_VERIFICATION" : "PENDING_REVIEW";
        jdbc.update("""
            UPDATE contact_submissions SET verification_token_hash = ?, verification_expires_at = ?,
                status = ?, notification_error = NULL, updated_at = now() WHERE id = ?
            """, sha256(token), Timestamp.from(Instant.now().plusSeconds(86400)), status, id);
        try {
            mail.sendVerification(String.valueOf(row.get("sender_email")), String.valueOf(row.get("sender_name")), token);
        } catch (Exception exception) {
            jdbc.update("UPDATE contact_submissions SET status = 'VERIFICATION_FAILED', notification_error = ?, updated_at = now() WHERE id = ?",
                "Verification email could not be sent; owner intervention is required.", id);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Email verification is temporarily unavailable");
        }
        return find(id);
    }

    public List<Map<String, Object>> list() {
        return jdbc.queryForList("""
            SELECT id, sender_name, organization, sender_email, subject, message, ai_decision,
                   ai_confidence, ai_risk_score, ai_identity_assessment, ai_reason, status,
                   email_verified_at, notification_sent_at, notification_attempts, notification_error, reviewed_by,
                   reviewed_at, review_note, created_at
            FROM contact_submissions ORDER BY created_at DESC LIMIT 200
            """);
    }

    public Map<String, Object> review(UUID id, boolean approve, String note, String reviewer) {
        Map<String, Object> row = find(id);
        if ("REJECT".equals(row.get("ai_decision")))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "AI-rejected submissions cannot be approved automatically");
        if (approve && row.get("email_verified_at") == null)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The sender must verify email ownership before approval");
        if (!List.of("PENDING_EMAIL_VERIFICATION", "PENDING_REVIEW", "APPROVED", "DELIVERY_FAILED", "VERIFICATION_FAILED").contains(row.get("status")))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This submission cannot be reviewed in its current state");
        jdbc.update("""
            UPDATE contact_submissions SET status = ?, reviewed_by = ?, reviewed_at = now(), review_note = ?,
                updated_at = now() WHERE id = ?
            """, approve ? "APPROVED" : "REJECTED", reviewer, truncate(note, 500), id);
        if (approve) notifyOwner(id);
        return find(id);
    }

    public Map<String, Object> retryDelivery(UUID id) {
        Map<String, Object> row = find(id);
        if (!"DELIVERY_FAILED".equals(row.get("status")))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only failed notifications can be retried");
        if (row.get("email_verified_at") == null || "REJECT".equals(row.get("ai_decision")))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This submission is not eligible for delivery");
        jdbc.update("UPDATE contact_submissions SET status = 'APPROVED', updated_at = now() WHERE id = ?", id);
        notifyOwner(id);
        return find(id);
    }

    private void notifyOwner(UUID id) {
        int claimed = jdbc.update("""
            UPDATE contact_submissions SET status = 'NOTIFYING', notification_attempts = notification_attempts + 1, updated_at = now()
            WHERE id = ? AND status IN ('APPROVED', 'DELIVERY_FAILED') AND email_verified_at IS NOT NULL
            """, id);
        if (claimed == 0) return;
        Map<String, Object> row = find(id);
        try {
            mail.sendInboxNotification(new ContactMailService.ContactMessage(id,
                String.valueOf(row.get("sender_name")), (String) row.get("organization"),
                String.valueOf(row.get("sender_email")), String.valueOf(row.get("subject")),
                String.valueOf(row.get("message")), String.valueOf(row.get("ai_decision")),
                ((Number) row.get("ai_risk_score")).intValue(), String.valueOf(row.get("ai_identity_assessment")),
                String.valueOf(row.get("ai_reason"))));
            jdbc.update("UPDATE contact_submissions SET status = 'NOTIFIED', notification_sent_at = now(), notification_error = NULL, updated_at = now() WHERE id = ?", id);
        } catch (Exception exception) {
            jdbc.update("UPDATE contact_submissions SET status = 'DELIVERY_FAILED', notification_error = ?, updated_at = now() WHERE id = ?",
                "Inbox notification delivery failed. Check SMTP configuration and retry.", id);
        }
    }

    private Map<String, Object> find(UUID id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM contact_submissions WHERE id = ?", id);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact submission not found");
        return rows.get(0);
    }
    private String currentStatus(UUID id) { return String.valueOf(find(id).get("status")); }
    private String hashIp(String ip) { return ip == null || ip.isBlank() ? null : sha256(ipSalt + ":" + ip); }
    private static String sha256(String value) {
        try { return java.util.HexFormat.of().formatHex(MessageDigestHolder.digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception exception) { throw new IllegalStateException("SHA-256 unavailable", exception); }
    }
    private static String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static String truncate(String value, int max) { return value == null ? null : value.substring(0, Math.min(value.length(), max)); }
    private static final class MessageDigestHolder {
        private static byte[] digest(byte[] input) throws Exception { return java.security.MessageDigest.getInstance("SHA-256").digest(input); }
    }

    public record SubmissionResult(String status, UUID id) { }
    public record VerificationResult(UUID id, String status) { }
}
