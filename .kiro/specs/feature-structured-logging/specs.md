# Specs: Structured Logging

## What it is

Centralized structured JSON logging for api-core using Pino, with automatic request correlation (traceId), Prisma query logging, and environment-aware formatting (pretty for dev, JSON for production).

## Functional requirements

- FR1. Replace NestJS default logger with Pino (structured JSON output).
- FR2. Automatic `requestId` generation per HTTP request, propagated to all logs within that request lifecycle.
- FR3. HTTP request/response logging: method, url, status, duration.
- FR4. Prisma query logging: slow queries (> 200ms) logged as warnings.
- FR5. Environment-aware output: pretty-printed in dev, JSON in production.
- FR6. BullMQ job context: job ID and queue name included in processor logs.
- FR7. All existing `this.logger.log/warn/error()` calls continue to work (zero refactor needed).

## Non-functional requirements

- Zero changes to existing business logic code.
- Log level configurable via `LOG_LEVEL` env var (default: `info` in prod, `debug` in dev).
- pino-pretty only used in dev (not bundled in production Docker image).
