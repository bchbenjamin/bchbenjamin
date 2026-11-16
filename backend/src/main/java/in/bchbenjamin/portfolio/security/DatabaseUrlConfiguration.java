package in.bchbenjamin.portfolio.security;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import javax.sql.DataSource;

@Configuration
public class DatabaseUrlConfiguration {
    @Bean
    @Primary
    DataSource dataSource(
        @Value("${spring.datasource.url}") String configuredUrl,
        @Value("${spring.datasource.username:}") String configuredUsername,
        @Value("${spring.datasource.password:}") String configuredPassword,
        @Value("${app.datasource.maximum-pool-size:5}") int maximumPoolSize
    ) {
        return createDataSource(configuredUrl, configuredUsername, configuredPassword, maximumPoolSize);
    }

    @Bean
    @FlywayDataSource
    DataSource flywayDataSource(
        @Value("${spring.datasource.url}") String configuredUrl,
        @Value("${DATABASE_URL_UNPOOLED:}") String unpooledUrl,
        @Value("${FLYWAY_DATABASE_URL:}") String flywayUrl,
        @Value("${spring.datasource.username:}") String configuredUsername,
        @Value("${spring.datasource.password:}") String configuredPassword
    ) {
        String migrationUrl = firstNonBlank(flywayUrl, unpooledUrl, configuredUrl);
        return createDataSource(migrationUrl, configuredUsername, configuredPassword, 1);
    }

    private HikariDataSource createDataSource(String configuredUrl, String configuredUsername,
                                               String configuredPassword, int maximumPoolSize) {
        HikariConfig config = new HikariConfig();
        String url = configuredUrl;
        String username = configuredUsername;
        String password = configuredPassword;
        if (configuredUrl.startsWith("postgres://") || configuredUrl.startsWith("postgresql://")) {
            URI uri = URI.create(configuredUrl);
            String path = uri.getPath() == null ? "/" : uri.getPath();
            url = "jdbc:postgresql://" + uri.getHost() + ":" + (uri.getPort() > 0 ? uri.getPort() : 5432)
                + path + (uri.getRawQuery() == null ? "?sslmode=require" : "?" + uri.getRawQuery());
            if (uri.getUserInfo() != null) {
                String[] credentials = uri.getUserInfo().split(":", 2);
                username = credentials[0];
                if (credentials.length > 1) password = credentials[1];
            }
        }
        config.setJdbcUrl(url);
        if (username != null && !username.isBlank()) config.setUsername(username);
        if (password != null) config.setPassword(password);
        config.setMaximumPoolSize(Math.max(1, Math.min(maximumPoolSize, 20)));
        config.setMinimumIdle(0);
        config.setConnectionTimeout(10000);
        config.setValidationTimeout(5000);
        config.setMaxLifetime(600000);
        config.setIdleTimeout(300000);
        return new HikariDataSource(config);
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) if (value != null && !value.isBlank()) return value;
        throw new IllegalStateException("A database URL is required");
    }
}
