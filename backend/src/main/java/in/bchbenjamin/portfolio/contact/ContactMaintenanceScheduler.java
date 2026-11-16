package in.bchbenjamin.portfolio.contact;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.contact.maintenance-enabled", havingValue = "true")
public class ContactMaintenanceScheduler {
    private final ContactMaintenanceJob maintenance;
    public ContactMaintenanceScheduler(ContactMaintenanceJob maintenance) { this.maintenance = maintenance; }

    @Scheduled(fixedDelayString = "${app.contact.maintenance-delay-ms:300000}", initialDelayString = "${app.contact.maintenance-delay-ms:300000}")
    public void run() { maintenance.recoverAndPurge(); }
}
