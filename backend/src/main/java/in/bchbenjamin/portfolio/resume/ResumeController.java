package in.bchbenjamin.portfolio.resume;

import in.bchbenjamin.portfolio.admin.AdminAuditService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/resumes")
public class ResumeController {
    public record GenerateRequest(String mode, String jobDescription, String templateId) { }

    private final ResumeGenerationService generation;
    private final AdminAuditService audit;

    public ResumeController(ResumeGenerationService generation, AdminAuditService audit) {
        this.generation = generation;
        this.audit = audit;
    }

    @PostMapping("/generate")
    public ResumeGenerationService.GeneratedResume generate(@RequestBody GenerateRequest request,
                                                              @AuthenticationPrincipal OidcUser actor) {
        var generated = generation.generate(request.mode(), request.jobDescription(), request.templateId());
        audit.record(actor, "GENERATE", "resume", generated.id());
        return generated;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return generation.list();
    }

    @GetMapping(value = "/{id}/download", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> download(@PathVariable UUID id) {
        byte[] pdf = generation.download(id);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF)
            .cacheControl(CacheControl.noStore())
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Benjamin-resume-" + id + ".pdf")
            .body(pdf);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal OidcUser actor) {
        generation.delete(id);
        audit.record(actor, "DELETE", "resume", id);
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }
}
