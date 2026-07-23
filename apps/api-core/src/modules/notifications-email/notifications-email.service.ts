import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export type EmailTemplate = 'purchase-confirmation' | 'quote-sent' | 'complaint-receipt';

/**
 * TASK-i18n-7: Template selection based on record locale.
 * Always reads locale from the record, NEVER from the current request.
 */
@Injectable()
export class NotificationsEmailService {
  private readonly logger = new Logger(NotificationsEmailService.name);
  private readonly templatesDir: string;

  constructor() {
    this.templatesDir = path.join(__dirname, 'templates');
  }

  /**
   * Resolves template content by name and locale.
   * Falls back to 'es' if locale is missing or template doesn't exist.
   */
  getTemplate(templateName: EmailTemplate, locale: string): string {
    const resolvedLocale = locale === 'en' ? 'en' : 'es';
    const templatePath = path.join(this.templatesDir, resolvedLocale, `${templateName}.hbs`);

    try {
      return fs.readFileSync(templatePath, 'utf-8');
    } catch {
      // Fallback to Spanish
      const fallbackPath = path.join(this.templatesDir, 'es', `${templateName}.hbs`);
      try {
        return fs.readFileSync(fallbackPath, 'utf-8');
      } catch {
        this.logger.error(`Template not found: ${templateName} (${resolvedLocale})`);
        return '';
      }
    }
  }

  /**
   * Simple template rendering (replaces {{key}} with values).
   * In production: use Handlebars.compile().
   */
  render(template: string, data: Record<string, unknown>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value ?? ''));
    }
    // Handle {{#if key}}...{{/if}} blocks (simple version)
    result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
      return data[key] ? content : '';
    });
    return result;
  }

  /**
   * Get and render a template for a record.
   * Uses record.locale (not request locale).
   */
  renderForRecord(
    templateName: EmailTemplate,
    recordLocale: string | null | undefined,
    data: Record<string, unknown>,
  ): string {
    const locale = recordLocale || 'es';
    const template = this.getTemplate(templateName, locale);
    return this.render(template, data);
  }
}
