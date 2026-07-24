import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

/**
 * Feature: Structured Logging
 *
 * Configures Pino as the application logger with:
 * - Automatic requestId per HTTP request (correlation)
 * - Structured JSON output in production
 * - Pretty-printed output in development
 * - Configurable log level via LOG_LEVEL env var
 */
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        // Generate unique request ID for correlation
        genReqId: (req) => {
          return (
            (req.headers['x-request-id'] as string) ??
            `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
          );
        },

        // Log level
        level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

        // Custom log attributes
        customProps: () => ({
          service: 'api-core',
        }),

        // Redact sensitive fields from logs
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["x-webhook-signature"]',
          ],
          censor: '[REDACTED]',
        },

        // Serializers for clean output
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            query: req.query,
            remoteAddress: req.remoteAddress,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },

        // Pretty print in development only
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: false,
                  translateTime: 'HH:MM:ss.l',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
      },
    }),
  ],
})
export class LoggerModule {}
