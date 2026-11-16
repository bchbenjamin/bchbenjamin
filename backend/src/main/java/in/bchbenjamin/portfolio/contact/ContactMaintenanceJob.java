package in.bchbenjamin.portfolio.contact;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ContactMaintenanceJob {
    private final JdbcTemplate jdbc;
    private final int retentionDays;

    public ContactMaintenanceJob(JdbcTemplate jdbc,
        @Value("${app.contact.retention-days:180}") int retentionDays) {
        this.jdbc = jdbc;
        this.retentionDays = Math.max(30, Math.min(retentionDays, 730));
    }

    public MaintenanceResult recoverAndPurge() {
        int recovered = jdbc.update("""
            UPDATE contact_submissions SET status = 'DELIVERY_FAILED',
                notification_error = 'Delivery worker stopped before recording its result; retry is available.',
                updated_at = now()
            WHERE status = 'NOTIFYING' AND updated_at < now() - interval '10 minutes'
            """);
        int contactsDeleted = jdbc.update("DELETE FROM contact_submissions WHERE created_at < now() - (? * interval '1 day')", retentionDays);
        int sessionsDeleted = jdbc.update("DELETE FROM SPRING_SESSION WHERE EXPIRY_TIME < ?", System.currentTimeMillis());
        int rateLimitBucketsDeleted = jdbc.update("DELETE FROM contact_rate_limits WHERE window_start < ?", (System.currentTimeMillis() / 60_000L) - 1440);
        return new MaintenanceResult(recovered, contactsDeleted, sessionsDeleted, rateLimitBucketsDeleted);
    }

    public record MaintenanceResult(int recoveredNotifications, int deletedContactRecords, int deletedSessions, int deletedRateLimitBuckets) { }
}
