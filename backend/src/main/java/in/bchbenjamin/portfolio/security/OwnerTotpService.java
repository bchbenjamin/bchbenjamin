package in.bchbenjamin.portfolio.security;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OwnerTotpService {
    private static final String BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int SECRET_BYTES = 20;
    private static final long PERIOD_SECONDS = 30;
    private final JdbcTemplate jdbc;
    private final byte[] encryptionKey;
    private final SecureRandom random = new SecureRandom();

    public OwnerTotpService(JdbcTemplate jdbc, @Value("${app.security.token-encryption-key:}") String configuredKey) {
        this.jdbc = jdbc;
        this.encryptionKey = configuredKey.isBlank() ? null : Base64.getDecoder().decode(configuredKey);
        if (encryptionKey != null && encryptionKey.length != 32) throw new IllegalArgumentException("TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte AES-256 key");
    }

    public boolean isEnabled(String issuer, String subject) {
        Integer count = jdbc.queryForObject("SELECT count(*) FROM admin_totp_credentials WHERE issuer = ? AND subject = ? AND enabled = TRUE", Integer.class, issuer, subject);
        return count != null && count > 0;
    }

    public Enrollment beginEnrollment(String issuer, String subject, String accountName, boolean replaceExisting) {
        if (isEnabled(issuer, subject) && !replaceExisting) throw new IllegalStateException("An authenticator is already enrolled. Verify with the existing authenticator first.");
        byte[] secret = new byte[SECRET_BYTES]; random.nextBytes(secret);
        Encrypted encrypted = encrypt(secret);
        jdbc.update("""
            INSERT INTO admin_totp_credentials (issuer, subject, secret_ciphertext, secret_iv, enabled, last_counter, failed_attempts, locked_until, updated_at)
            VALUES (?, ?, ?, ?, FALSE, -1, 0, NULL, now())
            ON CONFLICT (issuer, subject) DO UPDATE SET secret_ciphertext = EXCLUDED.secret_ciphertext,
              secret_iv = EXCLUDED.secret_iv, enabled = FALSE, last_counter = -1, failed_attempts = 0, locked_until = NULL, updated_at = now()
            """, issuer, subject, encrypted.ciphertext(), encrypted.iv());
        String encoded = encodeBase32(secret);
        String label = urlEncode("Benjamin Portfolio:" + accountName);
        String issuerParam = urlEncode("Benjamin Portfolio");
        String uri = "otpauth://totp/" + label + "?secret=" + encoded + "&issuer=" + issuerParam + "&algorithm=SHA1&digits=6&period=30";
        return new Enrollment(encoded, uri);
    }

    @Transactional
    public boolean confirmEnrollment(String issuer, String subject, String code) {
        return verifyAndConsume(issuer, subject, code, true);
    }

    @Transactional
    public boolean verifyAndConsume(String issuer, String subject, String code) {
        return verifyAndConsume(issuer, subject, code, false);
    }

    protected boolean verifyAndConsume(String issuer, String subject, String code, boolean enableAfter) {
        var row = jdbc.query("""
            SELECT secret_ciphertext, secret_iv, enabled, last_counter, failed_attempts, locked_until
            FROM admin_totp_credentials WHERE issuer = ? AND subject = ? FOR UPDATE
            """, rs -> {
            if (!rs.next()) return null;
            return new Credential(rs.getBytes("secret_ciphertext"), rs.getBytes("secret_iv"), rs.getBoolean("enabled"),
                rs.getLong("last_counter"), rs.getInt("failed_attempts"), rs.getTimestamp("locked_until") == null ? null : rs.getTimestamp("locked_until").toInstant());
        }, issuer, subject);
        if (row == null || (!enableAfter && !row.enabled())) return false;
        Instant now = Instant.now();
        if (row.lockedUntil() != null && row.lockedUntil().isAfter(now)) return false;
        int previousFailures = row.lockedUntil() != null && !row.lockedUntil().isAfter(now) ? 0 : row.failedAttempts();
        if (code == null || !code.matches("^[0-9]{6}$")) return failed(issuer, subject, previousFailures);
        byte[] secret = decrypt(row.ciphertext(), row.iv());
        long current = now.getEpochSecond() / PERIOD_SECONDS;
        long matched = -1;
        for (long counter = current - 1; counter <= current + 1; counter++) {
            if (counter > row.lastCounter() && MessageDigest.isEqual(totp(secret, counter).getBytes(StandardCharsets.US_ASCII), code.getBytes(StandardCharsets.US_ASCII))) matched = counter;
        }
        if (matched < 0) return failed(issuer, subject, previousFailures);
        jdbc.update("UPDATE admin_totp_credentials SET enabled = CASE WHEN ? THEN TRUE ELSE enabled END, last_counter = ?, failed_attempts = 0, locked_until = NULL, updated_at = now() WHERE issuer = ? AND subject = ?",
            enableAfter, matched, issuer, subject);
        return true;
    }

    private boolean failed(String issuer, String subject, int previous) {
        int attempts = previous + 1;
        jdbc.update("UPDATE admin_totp_credentials SET failed_attempts = ?, locked_until = CASE WHEN ? >= 5 THEN now() + interval '5 minutes' ELSE NULL END, updated_at = now() WHERE issuer = ? AND subject = ?",
            attempts, attempts, issuer, subject);
        return false;
    }

    private Encrypted encrypt(byte[] value) {
        if (encryptionKey == null) throw new IllegalStateException("TOKEN_ENCRYPTION_KEY must be configured before enrolling an authenticator");
        try {
            byte[] iv = new byte[12]; random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(encryptionKey, "AES"), new GCMParameterSpec(128, iv));
            return new Encrypted(cipher.doFinal(value), iv);
        } catch (GeneralSecurityException ex) { throw new IllegalStateException("Could not protect authenticator secret", ex); }
    }

    private byte[] decrypt(byte[] ciphertext, byte[] iv) {
        if (encryptionKey == null) throw new IllegalStateException("TOKEN_ENCRYPTION_KEY is not configured");
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(encryptionKey, "AES"), new GCMParameterSpec(128, iv));
            return cipher.doFinal(ciphertext);
        } catch (GeneralSecurityException ex) { throw new IllegalStateException("Could not decrypt authenticator secret", ex); }
    }

    private static String totp(byte[] secret, long counter) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1"); mac.init(new SecretKeySpec(secret, "HmacSHA1"));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(counter).array());
            int offset = hash[hash.length - 1] & 0x0f;
            int binary = ((hash[offset] & 0x7f) << 24) | ((hash[offset+1] & 0xff) << 16) | ((hash[offset+2] & 0xff) << 8) | (hash[offset+3] & 0xff);
            return String.format(Locale.ROOT, "%06d", binary % 1_000_000);
        } catch (GeneralSecurityException ex) { throw new IllegalStateException("TOTP calculation failed", ex); }
    }

    private static String encodeBase32(byte[] bytes) {
        StringBuilder out = new StringBuilder(); int buffer = 0, bits = 0;
        for (byte value : bytes) { buffer = (buffer << 8) | (value & 0xff); bits += 8; while (bits >= 5) { out.append(BASE32.charAt((buffer >> (bits - 5)) & 31)); bits -= 5; } }
        if (bits > 0) out.append(BASE32.charAt((buffer << (5 - bits)) & 31));
        return out.toString();
    }

    private static String urlEncode(String value) { return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8); }
    public record Enrollment(String secret, String otpauthUri) { }
    private record Encrypted(byte[] ciphertext, byte[] iv) { }
    private record Credential(byte[] ciphertext, byte[] iv, boolean enabled, long lastCounter, int failedAttempts, Instant lockedUntil) { }
}
