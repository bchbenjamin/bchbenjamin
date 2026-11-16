package in.bchbenjamin.portfolio.agent;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AgentTokenService {
    public static final Set<String> ALLOWED_SCOPES = Set.of("portfolio:read", "portfolio:propose");
    private final JdbcTemplate jdbc;
    private final SecureRandom random = new SecureRandom();

    public AgentTokenService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public CreatedToken create(String name, Set<String> scopes, Integer expiresInDays, String createdBy) {
        if (name == null || name.isBlank() || name.length() > 120) throw new IllegalArgumentException("Token name must contain 1–120 characters");
        if (scopes == null || scopes.isEmpty() || !ALLOWED_SCOPES.containsAll(scopes)) throw new IllegalArgumentException("Select one or more supported scopes");
        int expiryDays = expiresInDays == null ? 90 : expiresInDays;
        if (expiryDays < 1 || expiryDays > 365) throw new IllegalArgumentException("Token expiry must be between 1 and 365 days");
        byte[] entropy = new byte[32];
        random.nextBytes(entropy);
        String token = "bch_pat_" + Base64.getUrlEncoder().withoutPadding().encodeToString(entropy);
        String prefix = token.substring(0, Math.min(20, token.length()));
        String hash = sha256(token);
        Instant expiry = Instant.now().plus(expiryDays, ChronoUnit.DAYS);
        UUID id = jdbc.queryForObject("""
            INSERT INTO agent_api_tokens (token_hash, token_prefix, name, scopes, created_by, expires_at)
            VALUES (?, ?, ?, ?, ?, ?) RETURNING id
            """, UUID.class, hash, prefix, name.trim(), String.join(",", scopes), createdBy, Timestamp.from(expiry));
        return new CreatedToken(id, token, prefix, name.trim(), scopes, expiry);
    }

    public AgentIdentity authenticate(String token) {
        if (token == null || !token.startsWith("bch_pat_")) return null;
        String hash = sha256(token);
        List<AgentIdentity> matches = jdbc.query("""
            SELECT id, name, scopes FROM agent_api_tokens
            WHERE token_hash = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())
            """, (rs, rowNum) -> new AgentIdentity(
                rs.getObject("id", UUID.class), rs.getString("name"), Set.of(rs.getString("scopes").split(","))
            ), hash);
        if (matches.isEmpty()) return null;
        AgentIdentity identity = matches.get(0);
        jdbc.update("UPDATE agent_api_tokens SET last_used_at = now() WHERE id = ?", identity.id());
        return identity;
    }

    public List<Map<String, Object>> list() {
        return jdbc.queryForList("""
            SELECT id, token_prefix, name, scopes, created_at, expires_at, last_used_at, revoked_at
            FROM agent_api_tokens ORDER BY created_at DESC
            """);
    }

    public void revoke(UUID id) {
        int updated = jdbc.update("UPDATE agent_api_tokens SET revoked_at = now() WHERE id = ? AND revoked_at IS NULL", id);
        if (updated == 0) throw new IllegalArgumentException("Token not found or already revoked");
    }

    private static String sha256(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    public record AgentIdentity(UUID id, String name, Set<String> scopes) { }
    public record CreatedToken(UUID id, String token, String prefix, String name, Set<String> scopes, Instant expiresAt) { }
}
