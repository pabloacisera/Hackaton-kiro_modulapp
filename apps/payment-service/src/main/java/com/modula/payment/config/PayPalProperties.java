package com.modula.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Strongly typed binding for PayPal configuration from application.yml.
 * Registered via @EnableConfigurationProperties in AppConfig.
 */
@ConfigurationProperties(prefix = "paypal")
public class PayPalProperties {

    private String clientId;
    private String clientSecret;
    private String mode = "sandbox";
    private String webhookId;
    private String appPublicUrl = "https://localhost";

    // ── Sandbox/Live base URLs ───────────────────────────────────────────────

    public String getBaseUrl() {
        return "sandbox".equalsIgnoreCase(mode)
                ? "https://api-m.sandbox.paypal.com"
                : "https://api-m.paypal.com";
    }

    // ── Getters / Setters ────────────────────────────────────────────────────

    public String getClientId()     { return clientId; }
    public void setClientId(String v) { this.clientId = v; }

    public String getClientSecret()     { return clientSecret; }
    public void setClientSecret(String v) { this.clientSecret = v; }

    public String getMode()     { return mode; }
    public void setMode(String v) { this.mode = v; }

    public String getWebhookId()     { return webhookId; }
    public void setWebhookId(String v) { this.webhookId = v; }

    public String getAppPublicUrl()     { return appPublicUrl; }
    public void setAppPublicUrl(String v) { this.appPublicUrl = v; }
}
