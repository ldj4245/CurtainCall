package com.curtaincall.infra.oauth2;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Component
public class OAuth2AuthorizationCodeStore {

    private final Cache<String, Long> codes = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofMinutes(5))
            .maximumSize(1_000)
            .build();

    public String issue(Long userId) {
        String code = UUID.randomUUID().toString();
        codes.put(code, userId);
        return code;
    }

    public Optional<Long> consume(String code) {
        Long userId = codes.getIfPresent(code);
        if (userId != null) {
            codes.invalidate(code);
        }
        return Optional.ofNullable(userId);
    }
}
