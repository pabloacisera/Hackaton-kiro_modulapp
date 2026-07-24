package com.modula.payment.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Uploads files (PDF receipts) to Supabase Storage.
 */
@Service
public class SupabaseStorageClient {

    private static final Logger log = LoggerFactory.getLogger(SupabaseStorageClient.class);

    private final String supabaseUrl;
    private final String bucket;
    private final String serviceRoleKey;
    private final RestTemplate restTemplate;
    private final boolean configured;

    public SupabaseStorageClient(
            @Value("${supabase.url:}") String supabaseUrl,
            @Value("${supabase.storage-bucket:}") String bucket,
            @Value("${supabase.service-role-key:}") String serviceRoleKey,
            RestTemplate restTemplate) {
        this.supabaseUrl = supabaseUrl != null ? supabaseUrl.replaceAll("/$", "") : "";
        this.bucket = bucket != null ? bucket : "";
        this.serviceRoleKey = serviceRoleKey != null ? serviceRoleKey : "";
        this.restTemplate = restTemplate;
        this.configured = !this.supabaseUrl.isEmpty() && !this.bucket.isEmpty() && !this.serviceRoleKey.isEmpty();

        if (!this.configured) {
            log.warn("Supabase Storage not configured. PDF receipts will use base64 data URLs.");
        } else {
            log.info("Supabase Storage configured → bucket: {}", this.bucket);
        }
    }

    /**
     * Upload a file to Supabase Storage.
     *
     * @param folder   Folder within the bucket (e.g. "receipts")
     * @param fileName File name (e.g. "receipt-abc123.pdf")
     * @param data     File content
     * @param contentType MIME type (e.g. "application/pdf")
     * @return Public URL of the uploaded file, or null if not configured
     */
    public String upload(String folder, String fileName, byte[] data, String contentType) {
        if (!configured) {
            return null;
        }

        String path = folder + "/" + System.currentTimeMillis() + "-" + fileName;
        String url = supabaseUrl + "/storage/v1/object/" + bucket + "/" + path;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(serviceRoleKey);
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.set("x-upsert", "true");

        HttpEntity<byte[]> entity = new HttpEntity<>(data, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                String publicUrl = supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + path;
                log.info("Uploaded to storage: {} ({} bytes)", path, data.length);
                return publicUrl;
            } else {
                log.error("Storage upload failed: {} {}", response.getStatusCode(), response.getBody());
                return null;
            }
        } catch (Exception e) {
            log.error("Storage upload exception: {}", e.getMessage());
            return null;
        }
    }

    public boolean isConfigured() {
        return configured;
    }
}
