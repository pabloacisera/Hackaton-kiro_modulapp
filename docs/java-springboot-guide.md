# Java Spring Boot guide for beginners

This guide is for developers who have never worked with Java/Spring Boot.
It covers the basics needed to work on `apps/payment-service`.

## Prerequisites

- Java 17+ installed
- Maven or Gradle (project uses Maven)
- IDE with Java support (IntelliJ IDEA recommended)

## Project structure

```
apps/payment-service/
  src/main/java/com/modula/payment/
    controller/     HTTP endpoints
    service/        Business logic
    domain/         Entities and value objects
    repository/     Database access (JPA/Hibernate)
    config/         Spring configuration
  src/main/resources/
    application.yml # Configuration file
  pom.xml          Dependencies
```

## Key concepts

### Spring Boot

Spring Boot is a framework that simplifies Java application development.
It provides auto-configuration, embedded servers, and production-ready features.

### Dependency Injection

Spring manages object creation and wiring. Instead of `new UserService()`,
you declare dependencies and Spring injects them:

```java
@Service
public class PaymentService {
    private final PayPalClient payPalClient;

    public PaymentService(PayPalClient payPalClient) {
        this.payPalClient = payPalClient;
    }
}
```

### REST Controllers

Handle HTTP requests:

```java
@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(@RequestBody CreatePaymentRequest request) {
        // ...
    }
}
```

### JPA/Hibernate

Database access through repository pattern:

```java
@Entity
public class Payment {
    @Id
    @GeneratedValue
    private Long id;
    private BigDecimal amount;
    private String status;
}

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByStatus(String status);
}
```

## Running the service

```bash
cd apps/payment-service
mvn spring-boot:run
```

The service runs on port 8081 by default (configured in `application.yml`).

## Testing

```bash
mvn test
```

Tests use JUnit 5 and Mockito for unit tests, TestRestTemplate for integration tests.

## Communication with api-core

The payment-service communicates with api-core via:
- **HTTP**: api-core calls payment-service to initiate payments/refunds
- **Webhooks**: payment-service calls api-core to confirm payment results

All communication is via REST APIs — no shared database.
