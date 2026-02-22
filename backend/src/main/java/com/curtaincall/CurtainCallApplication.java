package com.curtaincall;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CurtainCallApplication {

    public static void main(String[] args) {
        SpringApplication.run(CurtainCallApplication.class, args);
    }
}
