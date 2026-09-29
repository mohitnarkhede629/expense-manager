package com.expensemanager.api.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", "testSecretKeyMustBeLongEnoughForHmacSha256Security1234567890!");
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 3600000L); // 1 hour
    }

    @Test
    @DisplayName("Should generate token and correctly extract email and userId")
    void shouldGenerateAndExtractClaims() {
        Long userId = 42L;
        String email = "testuser@example.com";

        String token = jwtService.generateToken(userId, email);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractEmail(token)).isEqualTo(email);
        assertThat(jwtService.extractUserId(token)).isEqualTo(userId);
    }

    @Test
    @DisplayName("Should validate token against matching email")
    void shouldValidateTokenAgainstMatchingEmail() {
        String email = "user@domain.com";
        String token = jwtService.generateToken(1L, email);

        assertThat(jwtService.isTokenValid(token, email)).isTrue();
        assertThat(jwtService.isTokenValid(token, "other@domain.com")).isFalse();
    }

    @Test
    @DisplayName("Should return null userId if claim is missing")
    void shouldReturnNullUserIdIfClaimMissing() {
        // Token without userId claim
        String email = "no-user-id@domain.com";
        String token = jwtService.generateToken(null, email);

        assertThat(jwtService.extractUserId(token)).isNull();
    }
}
