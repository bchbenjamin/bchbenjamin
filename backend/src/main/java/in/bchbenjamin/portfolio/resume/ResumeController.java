package in.bchbenjamin.portfolio.resume;

import java.util.Set;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1/public")
public class ResumeController {
    private static final Set<String> VARIANTS = Set.of("long", "short", "resume");
    private final ResumePdfService resumePdfService;

    public ResumeController(ResumePdfService resumePdfService) {
        this.resumePdfService = resumePdfService;
    }

    @GetMapping(value = "/resume.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> download(@RequestParam(defaultValue = "resume") String variant) {
        if (!VARIANTS.contains(variant)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown resume variant");
        byte[] pdf = resumePdfService.render(variant);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .cacheControl(CacheControl.noStore())
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Benjamin-" + variant + "-resume.pdf")
            .body(pdf);
    }
}
