import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

export interface UploadResult {
  /** Full public URL of the uploaded file */
  publicUrl: string;
  /** Storage path (bucket-relative) */
  path: string;
}

export interface UploadOptions {
  /** Folder within the bucket (e.g. 'products', 'receipts', 'imports') */
  folder: string;
  /** File name (will be prefixed with timestamp for uniqueness) */
  fileName: string;
  /** File content as Buffer */
  data: Buffer;
  /** MIME type (e.g. 'image/jpeg', 'application/pdf') */
  contentType: string;
  /** If true, makes the file publicly accessible (default: true) */
  public?: boolean;
}

/**
 * Supabase Storage service for uploading and managing files.
 * Used for: product images, Excel imports, PDF receipts.
 *
 * Requires env vars:
 *   SUPABASE_URL            — e.g. https://abc123.supabase.co
 *   SUPABASE_STORAGE_BUCKET — e.g. modula-files
 *   SUPABASE_SERVICE_ROLE_KEY — service role JWT
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private supabaseUrl: string;
  private bucket: string;
  private serviceRoleKey: string;
  private ready = false;

  onModuleInit() {
    this.supabaseUrl = process.env.SUPABASE_URL ?? '';
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET ?? '';
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

    if (!this.supabaseUrl || !this.bucket || !this.serviceRoleKey) {
      this.logger.warn(
        'Supabase Storage not configured (missing SUPABASE_URL, SUPABASE_STORAGE_BUCKET, or SUPABASE_SERVICE_ROLE_KEY). File uploads will fail.',
      );
      return;
    }

    // Remove trailing slash
    this.supabaseUrl = this.supabaseUrl.replace(/\/$/, '');
    this.ready = true;
    this.logger.log(`Storage ready → bucket: ${this.bucket}`);
  }

  /**
   * Upload a file to Supabase Storage.
   */
  async upload(options: UploadOptions): Promise<UploadResult> {
    if (!this.ready) {
      throw new Error(
        'StorageService not configured. Set SUPABASE_URL, SUPABASE_STORAGE_BUCKET, and SUPABASE_SERVICE_ROLE_KEY.',
      );
    }

    const { folder, fileName, data, contentType, public: isPublic = true } = options;
    const timestamp = Date.now();
    const path = `${folder}/${timestamp}-${fileName}`;

    const url = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${path}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: data,
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Upload failed: ${response.status} ${body}`);
      throw new Error(`Storage upload failed: ${response.status} — ${body}`);
    }

    const publicUrl = isPublic
      ? `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${path}`
      : `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${path}`;

    this.logger.log(`Uploaded: ${path} (${data.length} bytes)`);

    return { publicUrl, path };
  }

  /**
   * Delete a file from Supabase Storage.
   */
  async delete(path: string): Promise<void> {
    if (!this.ready) return;

    const url = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${path}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      const body = await response.text();
      this.logger.error(`Delete failed: ${response.status} ${body}`);
      throw new Error(`Storage delete failed: ${response.status}`);
    }
  }

  /**
   * Get the public URL for a stored file path.
   */
  getPublicUrl(path: string): string {
    return `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${path}`;
  }

  /**
   * Check if the service is properly configured.
   */
  isConfigured(): boolean {
    return this.ready;
  }
}
