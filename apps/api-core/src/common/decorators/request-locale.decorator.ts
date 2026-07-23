import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type SupportedLocale = 'es' | 'en';

const SUPPORTED_LOCALES: SupportedLocale[] = ['es', 'en'];

/**
 * TASK-i18n-5: Extracts locale from X-Locale header.
 * Validates against supported locales. Defaults to 'es'.
 *
 * Usage: @RequestLocale() locale: SupportedLocale
 */
export const RequestLocale = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SupportedLocale => {
    const request = ctx.switchToHttp().getRequest();
    const header = request.headers['x-locale'] as string | undefined;

    if (header && SUPPORTED_LOCALES.includes(header as SupportedLocale)) {
      return header as SupportedLocale;
    }

    return 'es';
  },
);
