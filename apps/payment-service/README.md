# apps/payment-service

Financial microservice. Java + Spring Boot. Responsible for:
- Payment processing (PayPal Orders API)
- Refunds (PayPal Refunds API)
- Receipt generation and delivery (PDF)

Isolated from NestJS. Communicates with `api-core` only via HTTP/webhooks.
Has its own database schema for transactions/receipts.

## Development

```bash
mvn spring-boot:run
```

Runs on http://localhost:8081.

## Prerequisites

- Java 17+
- Maven

See `docs/java-springboot-guide.md` for beginners.

## Testing

```bash
mvn test
```

Uses JUnit 5, Mockito (unit), TestRestTemplate (integration).

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/payments/orders` | Create PayPal order (idempotent) |
| POST | `/payments/webhooks/paypal` | PayPal webhook handler (signature validation, receipt generation) |
| POST | `/payments/orders/:ref/refund` | Process refund (idempotent) |
| GET | `/payments/:ref/receipt` | Get receipt PDF or signed URL |

## Communication with api-core

- **HTTP**: api-core calls payment-service to initiate payments/refunds
- **Webhooks**: payment-service calls api-core to confirm payment results

No shared database. All communication via REST APIs.
