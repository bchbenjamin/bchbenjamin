package in.bchbenjamin.portfolio.contact;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/internal")
public class InternalMaintenanceController {
    private final ContactMaintenanceJob maintenance;
    private final String cronSecret;

    public InternalMaintenanceController(ContactMaintenanceJob maintenance,
        @Value("${app.contact.cron-secret:}") String cronSecret) {
        this.maintenance = maintenance;
        this.cronSecret = cronSecret == null ? "" : cronSecret;
    }

    @PostMapping("/maintenance")
    public Map<String, Object> run(@RequestHeader(name = "Authorization", required = false) String authorization) {
        if (cronSecret.isBlank() || authorization == null || !MessageDigest.isEqual(
            ("Bearer " + cronSecret).getBytes(StandardCharsets.UTF_8), authorization.getBytes(StandardCharsets.UTF_8)))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid maintenance authorization");
        var result = maintenance.recoverAndPurge();
        return Map.of("status", "ok", "recoveredNotifications", result.recoveredNotifications(),
            "deletedContactRecords", result.deletedContactRecords(), "deletedSessions", result.deletedSessions(),
            "deletedRateLimitBuckets", result.deletedRateLimitBuckets());
    }
}
