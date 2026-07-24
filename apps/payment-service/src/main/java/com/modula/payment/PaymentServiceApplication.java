package com.modula.payment;

import com.modula.payment.config.DatabaseUrlEnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication
@EnableAspectJAutoProxy
public class PaymentServiceApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(PaymentServiceApplication.class);
        app.addEnvironmentPostProcessor(new DatabaseUrlEnvironmentPostProcessor());
        app.run(args);
    }
}
