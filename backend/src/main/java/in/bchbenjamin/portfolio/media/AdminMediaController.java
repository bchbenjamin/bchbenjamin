package in.bchbenjamin.portfolio.media;

import in.bchbenjamin.portfolio.admin.AdminAuditService;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1/admin/media")
public class AdminMediaController {
    private static final long MAX_BYTES = 12L * 1024L * 1024L;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "video/mp4", "video/webm");
    private static final Set<String> RESOURCE_TYPES = Set.of("project", "achievement", "experience", "education", "profile");
    private final JdbcTemplate jdbc;
    private final AdminAuditService audit;

    public AdminMediaController(JdbcTemplate jdbc, AdminAuditService audit) {
        this.jdbc = jdbc;
        this.audit = audit;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return jdbc.queryForList("""
            SELECT id, original_filename, content_type, byte_size, alt_text, caption, visibility, uploaded_by, uploaded_at, updated_at
            FROM media_assets ORDER BY uploaded_at DESC LIMIT 250
            """);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file,
                                      @RequestParam(defaultValue = "") String altText,
                                      @RequestParam(defaultValue = "") String caption,
                                      @RequestParam(defaultValue = "PRIVATE") String visibility,
                                      @AuthenticationPrincipal OidcUser actor) throws IOException {
        if (file.isEmpty() || file.getSize() > MAX_BYTES) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a file up to 12 MB");
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        byte[] bytes = file.getBytes();
        if (!ALLOWED_TYPES.contains(contentType) || !matchesSignature(contentType, bytes)) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "File content does not match an allowed image, video or PDF type");
        }
        String state = visibility.equalsIgnoreCase("PUBLIC") ? "PUBLIC" : "PRIVATE";
        UUID id = jdbc.queryForObject("""
            INSERT INTO media_assets (original_filename, content_type, byte_size, alt_text, caption, visibility, file_bytes, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
            """, UUID.class, safeFilename(file.getOriginalFilename()), contentType, file.getSize(), trim(altText, 300),
            trim(caption, 16000), state, bytes, actor.getSubject());
        audit.record(actor, "UPLOAD", "media", id);
        return get(id);
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable UUID id) {
        return jdbc.query("""
            SELECT id, original_filename, content_type, byte_size, alt_text, caption, visibility, uploaded_by, uploaded_at, updated_at
            FROM media_assets WHERE id = ?
            """, rs -> {
                if (!rs.next()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Media asset not found");
                return Map.ofEntries(Map.entry("id", rs.getObject("id")), Map.entry("originalFilename", rs.getString("original_filename")),
                    Map.entry("contentType", rs.getString("content_type")), Map.entry("byteSize", rs.getLong("byte_size")),
                    Map.entry("altText", rs.getString("alt_text")), Map.entry("caption", rs.getString("caption")),
                    Map.entry("visibility", rs.getString("visibility")), Map.entry("uploadedBy", rs.getString("uploaded_by")),
                    Map.entry("uploadedAt", rs.getTimestamp("uploaded_at")));
            }, id);
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable UUID id, @RequestBody Map<String, Object> body,
                                      @AuthenticationPrincipal OidcUser actor) {
        String altText = body.get("altText") == null ? "" : trim(String.valueOf(body.get("altText")), 300);
        String caption = body.get("caption") == null ? "" : trim(String.valueOf(body.get("caption")), 16000);
        String visibility = "PUBLIC".equalsIgnoreCase(String.valueOf(body.get("visibility"))) ? "PUBLIC" : "PRIVATE";
        int changed = jdbc.update("UPDATE media_assets SET alt_text = ?, caption = ?, visibility = ?, updated_at = now() WHERE id = ?",
            altText, caption, visibility, id);
        if (changed == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Media asset not found");
        audit.record(actor, "UPDATE", "media", id);
        return get(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal OidcUser actor) {
        if (jdbc.update("DELETE FROM media_assets WHERE id = ?", id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Media asset not found");
        audit.record(actor, "DELETE", "media", id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> privateFile(@PathVariable UUID id) { return file(id, false); }

    @PostMapping("/{id}/link")
    public Map<String, Object> link(@PathVariable UUID id, @RequestBody LinkRequest request,
                                    @AuthenticationPrincipal OidcUser actor) {
        if (!RESOURCE_TYPES.contains(request.resourceType()) || request.resourceId() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid media relationship");
        if (request.purpose() != null && (request.purpose().isBlank() || request.purpose().length() > 40)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Media purpose must be 1–40 characters");
        if (jdbc.queryForObject("SELECT COUNT(*) FROM media_assets WHERE id = ?", Long.class, id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Media asset not found");
        String resourceTable = switch (request.resourceType()) {
            case "project" -> "projects";
            case "achievement" -> "achievements";
            case "experience" -> "experience";
            case "education" -> "education";
            case "profile" -> "profile";
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid media resource type");
        };
        if (jdbc.queryForObject("SELECT COUNT(*) FROM " + resourceTable + " WHERE id = ?", Long.class, request.resourceId()) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Target content record not found");
        }
        jdbc.update("""
            INSERT INTO media_relationships (media_id, resource_type, resource_id, purpose, sort_order)
            VALUES (?, ?, ?, ?, ?) ON CONFLICT (media_id, resource_type, resource_id, purpose) DO UPDATE SET sort_order = EXCLUDED.sort_order
            """, id, request.resourceType(), request.resourceId(), request.purpose() == null ? "gallery" : trim(request.purpose(), 40), request.sortOrder());
        audit.record(actor, "LINK", "media", id);
        return Map.of("linked", true, "mediaId", id, "resourceType", request.resourceType(), "resourceId", request.resourceId());
    }

    @DeleteMapping("/{id}/link")
    public ResponseEntity<Void> unlink(@PathVariable UUID id, @RequestParam String resourceType,
                                       @RequestParam UUID resourceId, @RequestParam(defaultValue = "gallery") String purpose,
                                       @AuthenticationPrincipal OidcUser actor) {
        if (!RESOURCE_TYPES.contains(resourceType)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid media resource type");
        jdbc.update("DELETE FROM media_relationships WHERE media_id = ? AND resource_type = ? AND resource_id = ? AND purpose = ?",
            id, resourceType, resourceId, purpose);
        audit.record(actor, "UNLINK", "media", id);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<byte[]> file(UUID id, boolean publicAccess) {
        return jdbc.query("SELECT content_type, original_filename, file_bytes, visibility FROM media_assets WHERE id = ?", rs -> {
            if (!rs.next()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Media asset not found");
            String visibility = rs.getString("visibility");
            if (publicAccess && !"PUBLIC".equals(visibility)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Media asset not found");
            String type = rs.getString("content_type");
            String filename = rs.getString("original_filename").replace("\"", "");
            byte[] bytes = rs.getBytes("file_bytes");
            return ResponseEntity.ok().contentType(MediaType.parseMediaType(type))
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .header("X-Content-Type-Options", "nosniff").body(bytes);
        }, id);
    }

    private static boolean matchesSignature(String type, byte[] bytes) {
        if (bytes.length < 5) return false;
        return switch (type) {
            case "image/jpeg" -> bytes.length >= 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff;
            case "image/png" -> bytes.length >= 8 && (bytes[0] & 0xff) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47;
            case "image/gif" -> new String(bytes, 0, 3, java.nio.charset.StandardCharsets.US_ASCII).equals("GIF");
            case "image/webp" -> bytes.length >= 12 && new String(bytes, 0, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF") && new String(bytes, 8, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP");
            case "application/pdf" -> new String(bytes, 0, 5, java.nio.charset.StandardCharsets.US_ASCII).equals("%PDF-");
            case "video/mp4" -> bytes.length >= 12 && new String(bytes, 4, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("ftyp");
            case "video/webm" -> bytes.length >= 4 && (bytes[0] & 0xff) == 0x1a && (bytes[1] & 0xff) == 0x45 && (bytes[2] & 0xff) == 0xdf && (bytes[3] & 0xff) == 0xa3;
            default -> false;
        };
    }

    private static String safeFilename(String filename) {
        if (filename == null || filename.isBlank()) return "upload";
        String safe = filename.replaceAll("[^A-Za-z0-9._ -]", "_");
        return safe.substring(0, Math.min(255, safe.length()));
    }
    private static String trim(String value, int max) { return value.length() > max ? value.substring(0, max) : value; }
    public record LinkRequest(String resourceType, UUID resourceId, String purpose, int sortOrder) { }
}
