package com.modula.payment.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String SOURCE_KEY = "PAYMENT_DATABASE_URL";
    private static final String PROPERTY_SOURCE_NAME = "paymentDatabaseUrlNormalized";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment,
                                       SpringApplication application) {
        String raw = environment.getProperty(SOURCE_KEY);
        if (raw == null || raw.isBlank()) {
            System.out.println("[EPP] PAYMENT_DATABASE_URL not set, skipping");
            return;
        }

        System.out.println("[EPP] Raw PAYMENT_DATABASE_URL: " + raw);

        if (raw.startsWith("jdbc:")) {
            System.out.println("[EPP] Already JDBC format, skipping");
            return;
        }

        // Strip scheme prefix
        String withoutScheme = raw;
        if (raw.startsWith("postgresql://")) {
            withoutScheme = raw.substring("postgresql://".length());
        } else if (raw.startsWith("postgres://")) {
            withoutScheme = raw.substring("postgres://".length());
        } else {
            System.out.println("[EPP] Unknown scheme, skipping: " + raw);
            return;
        }

        try {
            // Split userinfo@host from the last @ (robust against @ in password)
            int atIndex = withoutScheme.lastIndexOf('@');
            String hostPortPath;
            String userInfo = null;

            if (atIndex >= 0) {
                userInfo = withoutScheme.substring(0, atIndex);
                hostPortPath = withoutScheme.substring(atIndex + 1);
            } else {
                hostPortPath = withoutScheme;
            }

            // Split host:port/path
            String host;
            int port = 5432;
            String path = "";

            int colonIndex = hostPortPath.indexOf(':');
            int slashIndex = hostPortPath.indexOf('/');

            if (slashIndex >= 0) {
                path = hostPortPath.substring(slashIndex);
                String hostPart = hostPortPath.substring(0, slashIndex);
                if (colonIndex >= 0 && colonIndex < slashIndex) {
                    host = hostPart.substring(0, colonIndex);
                    port = Integer.parseInt(hostPart.substring(colonIndex + 1));
                } else {
                    host = hostPart;
                }
            } else {
                host = hostPortPath;
            }

            String jdbcUrl = String.format("jdbc:postgresql://%s:%d%s", host, port, path);
            System.out.println("[EPP] Generated JDBC URL: " + jdbcUrl);

            Map<String, Object> overrides = new HashMap<>();
            overrides.put("spring.datasource.url", jdbcUrl);
            overrides.put("spring.flyway.url", jdbcUrl);

            if (userInfo != null && !userInfo.isEmpty()) {
                int passColon = userInfo.indexOf(':');
                if (passColon >= 0) {
                    String user = URLDecoder.decode(userInfo.substring(0, passColon), StandardCharsets.UTF_8);
                    String password = URLDecoder.decode(userInfo.substring(passColon + 1), StandardCharsets.UTF_8);
                    overrides.put("spring.datasource.username", user);
                    overrides.put("spring.datasource.password", password);
                    overrides.put("spring.flyway.user", user);
                    overrides.put("spring.flyway.password", password);
                    System.out.println("[EPP] Extracted credentials for user: " + user);
                } else {
                    String user = URLDecoder.decode(userInfo, StandardCharsets.UTF_8);
                    overrides.put("spring.datasource.username", user);
                    overrides.put("spring.flyway.user", user);
                    System.out.println("[EPP] Extracted user: " + user + " (no password)");
                }
            }

            environment.getPropertySources().addFirst(
                    new MapPropertySource(PROPERTY_SOURCE_NAME, overrides));
            System.out.println("[EPP] Overrides applied successfully");
        } catch (Exception e) {
            System.err.println("[EPP] Failed to parse PAYMENT_DATABASE_URL: " + e.getMessage());
            e.printStackTrace();
        }
    }
}