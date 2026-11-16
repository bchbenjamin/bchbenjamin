package in.bchbenjamin.portfolio.security;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.stereotype.Service;

@Service
public class EncryptedLinkedInAuthorizedClientService implements OAuth2AuthorizedClientService {
    private static final String PUBLISHER_REGISTRATION = "linkedin-publisher";
    private static final int IV_LENGTH = 12;
    private final JdbcTemplate jdbc;
    private final ClientRegistrationRepository registrations;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, OAuth2AuthorizedClient> transientClients = new ConcurrentHashMap<>();
    private final byte[] encryptionKey;

    public EncryptedLinkedInAuthorizedClientService(
        JdbcTemplate jdbc,
        ClientRegistrationRepository registrations,
        @Value("${app.security.token-encryption-key:}") String configuredKey
    ) {
        this.jdbc = jdbc;
        this.registrations = registrations;
        this.encryptionKey = configuredKey.isBlank() ? null : Base64.getDecoder().decode(configuredKey);
        if (encryptionKey != null && encryptionKey.length != 32) {
            throw new IllegalArgumentException("TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte AES-256 key");
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T extends OAuth2AuthorizedClient> T loadAuthorizedClient(String registrationId, String principalName) {
        if (!PUBLISHER_REGISTRATION.equals(registrationId)) {
            return (T) transientClients.get(key(registrationId, principalName));
        }
        return (T) jdbc.query("""
            SELECT access_token_ciphertext, access_token_iv, refresh_token_ciphertext, refresh_token_iv,
                   token_type, scopes, issued_at, expires_at
            FROM linkedin_authorized_clients WHERE principal_name = ? AND registration_id = ?
            """, rs -> {
            if (!rs.next()) return null;
            String accessToken = decrypt(rs.getBytes("access_token_ciphertext"), rs.getBytes("access_token_iv"));
            byte[] refreshCipher = rs.getBytes("refresh_token_ciphertext");
            String refreshToken = refreshCipher == null ? null : decrypt(refreshCipher, rs.getBytes("refresh_token_iv"));
            Instant issuedAt = rs.getTimestamp("issued_at") == null ? Instant.now() : rs.getTimestamp("issued_at").toInstant();
            Instant expiresAt = rs.getTimestamp("expires_at") == null ? null : rs.getTimestamp("expires_at").toInstant();
            var scopes = rs.getString("scopes").isBlank() ? java.util.Set.<String>of() : java.util.Set.of(rs.getString("scopes").split(" "));
            OAuth2AccessToken access = new OAuth2AccessToken(OAuth2AccessToken.TokenType.BEARER, accessToken, issuedAt, expiresAt, scopes);
            OAuth2RefreshToken refresh = refreshToken == null ? null : new OAuth2RefreshToken(refreshToken, issuedAt);
            ClientRegistration registration = registrations.findByRegistrationId(registrationId);
            return new OAuth2AuthorizedClient(registration, principalName, access, refresh);
        }, principalName, registrationId);
    }

    @Override
    public void saveAuthorizedClient(OAuth2AuthorizedClient client, Authentication principal) {
        String registrationId = client.getClientRegistration().getRegistrationId();
        String principalName = client.getPrincipalName();
        if (!PUBLISHER_REGISTRATION.equals(registrationId)) {
            transientClients.put(key(registrationId, principalName), client);
            return;
        }
        byte[] refresh = client.getRefreshToken() == null ? null : client.getRefreshToken().getTokenValue().getBytes(StandardCharsets.UTF_8);
        Encrypted access = encrypt(client.getAccessToken().getTokenValue());
        Encrypted refreshEncrypted = refresh == null ? null : encrypt(new String(refresh, StandardCharsets.UTF_8));
        Instant issued = client.getAccessToken().getIssuedAt();
        Instant expires = client.getAccessToken().getExpiresAt();
        String scopes = String.join(" ", client.getAccessToken().getScopes());
        jdbc.update("""
            INSERT INTO linkedin_authorized_clients
              (principal_name, registration_id, access_token_ciphertext, access_token_iv,
               refresh_token_ciphertext, refresh_token_iv, token_type, scopes, issued_at, expires_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())
            ON CONFLICT (principal_name) DO UPDATE SET
              registration_id = EXCLUDED.registration_id,
              access_token_ciphertext = EXCLUDED.access_token_ciphertext,
              access_token_iv = EXCLUDED.access_token_iv,
              refresh_token_ciphertext = EXCLUDED.refresh_token_ciphertext,
              refresh_token_iv = EXCLUDED.refresh_token_iv,
              token_type = EXCLUDED.token_type,
              scopes = EXCLUDED.scopes,
              issued_at = EXCLUDED.issued_at,
              expires_at = EXCLUDED.expires_at,
              updated_at = now()
            """, principalName, registrationId, access.ciphertext(), access.iv(),
            refreshEncrypted == null ? null : refreshEncrypted.ciphertext(),
            refreshEncrypted == null ? null : refreshEncrypted.iv(),
            client.getAccessToken().getTokenType().getValue(), scopes, issued, expires);
    }

    @Override
    public void removeAuthorizedClient(String registrationId, String principalName) {
        if (PUBLISHER_REGISTRATION.equals(registrationId)) {
            jdbc.update("DELETE FROM linkedin_authorized_clients WHERE principal_name = ? AND registration_id = ?", principalName, registrationId);
        } else {
            transientClients.remove(key(registrationId, principalName));
        }
    }

    private Encrypted encrypt(String value) {
        if (encryptionKey == null) throw new IllegalStateException("TOKEN_ENCRYPTION_KEY must be configured before connecting LinkedIn publishing");
        try {
            byte[] iv = new byte[IV_LENGTH];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(encryptionKey, "AES"), new GCMParameterSpec(128, iv));
            return new Encrypted(cipher.doFinal(value.getBytes(StandardCharsets.UTF_8)), iv);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Could not encrypt LinkedIn token", exception);
        }
    }

    private String decrypt(byte[] ciphertext, byte[] iv) {
        if (encryptionKey == null) throw new IllegalStateException("TOKEN_ENCRYPTION_KEY is not configured");
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(encryptionKey, "AES"), new GCMParameterSpec(128, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Could not decrypt LinkedIn token; check TOKEN_ENCRYPTION_KEY", exception);
        }
    }

    private static String key(String registrationId, String principalName) {
        return registrationId + ":" + principalName;
    }

    private record Encrypted(byte[] ciphertext, byte[] iv) { }
}
