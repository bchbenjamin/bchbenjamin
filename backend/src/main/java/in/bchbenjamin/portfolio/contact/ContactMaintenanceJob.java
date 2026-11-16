package in.bchbenjamin.portfolio.contact;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Component
@ConditionalOnProperty(name = "app.contact.maintenance-enabled", havingValue = "true", matchIfMissing = true)
public class ContactMaintenanceJob {
    private final JdbcTemplate jdbc;
    private final int retentionDays;

    public ContactMaintenanceJob(JdbcTemplate jdbc,
        @Value("${app.contact.retention-days:180}") int retentionDays) {
        this.jdbc = jdbc;
        this.retentionDays = Math.max(30, Math.min(retentionDays, 730));
    }

    @Scheduled(fixedDelayString = "${app.contact.maintenance-delay-ms:300000}", initialDelayString = "${app.contact.maintenance-delay-ms:300000}")
    public void recoverAndPurge() {
        jdbc.update("""
            UPDATE contact_submissions SET status = 'DELIVERY_FAILED',
                notification_error = 'Delivery worker stopped before recording its result; retry is available.',
                updated_at = now()
            WHERE status = 'NOTIFYING' AND updated_at < now() - interval '10 minutes'
            """);
        jdbc.update("DELETE FROM contact_submissions WHERE created_at < now() - (? * interval '1 day')", retentionDays);
    }
}
