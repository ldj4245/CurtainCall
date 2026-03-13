package com.curtaincall.global.jwt;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtTokenProviderTest {

    private final JwtTokenProvider jwtTokenProvider = new JwtTokenProvider(
            "curtaincall-test-secret-key-for-hs-256-algorithm-that-is-long-enough",
            3_600_000L,
            604_800_000L
    );

    @Test
    void accessTokenAndRefreshTokenHaveDifferentTypesAndKeepRole() {
        String accessToken = jwtTokenProvider.createAccessToken(1L, "admin@curtaincall.com", "ADMIN");
        String refreshToken = jwtTokenProvider.createRefreshToken(1L, "admin@curtaincall.com", "ADMIN");

        assertTrue(jwtTokenProvider.isAccessToken(accessToken));
        assertFalse(jwtTokenProvider.isRefreshToken(accessToken));
        assertEquals("ADMIN", jwtTokenProvider.getRole(accessToken));

        assertTrue(jwtTokenProvider.isRefreshToken(refreshToken));
        assertFalse(jwtTokenProvider.isAccessToken(refreshToken));
        assertEquals("ADMIN", jwtTokenProvider.getRole(refreshToken));
    }
}
