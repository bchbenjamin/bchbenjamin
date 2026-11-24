package in.bchbenjamin.portfolio.media;

import java.time.Duration;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1/public/media")
public class PublicMediaController {
    private final JdbcTemplate jdbc;
    public PublicMediaController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> get(@PathVariable UUID id) {
        return jdbc.query("SELECT content_type, file_bytes FROM media_assets WHERE id = ? AND visibility = 'PUBLIC' AND (content_type LIKE 'image/%' OR content_type LIKE 'video/%' OR content_type = 'application/pdf')", rs -> {
            if (!rs.next()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Media asset not found");
            return ResponseEntity.ok().contentType(MediaType.parseMediaType(rs.getString("content_type")))
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .header("X-Content-Type-Options", "nosniff")
                .body(rs.getBytes("file_bytes"));
        }, id);
    }
}
