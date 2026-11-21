package com.curtaincall.global.security;

import com.curtaincall.global.infra.storage.ImageUploadService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecurityHardeningTest {

    @Test
    void rateLimitBlocksSixteenthAuthRequestAndRespectsTrustedProxyOnlyFromLoopback() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(true);

        for (int i = 0; i < 15; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
            req.setRemoteAddr("127.0.0.1");
            req.addHeader("X-Real-Client-IP", "203.0.113.10");
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, new MockFilterChain());
            assertThat(res.getStatus()).isEqualTo(200);
        }

        MockHttpServletRequest blocked = new MockHttpServletRequest("POST", "/api/auth/login");
        blocked.setRemoteAddr("127.0.0.1");
        blocked.addHeader("X-Real-Client-IP", "203.0.113.10");
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        filter.doFilter(blocked, blockedRes, new MockFilterChain());
        assertThat(blockedRes.getStatus()).isEqualTo(429);
        assertThat(blockedRes.getHeader("Retry-After")).isEqualTo("60");

        MockHttpServletRequest spoofAttempt = new MockHttpServletRequest("GET", "/api/shows");
        spoofAttempt.setRemoteAddr("198.51.100.25");
        spoofAttempt.addHeader("X-Real-Client-IP", "1.1.1.1");
        assertThat(RateLimitFilter.resolveClientIp(spoofAttempt)).isEqualTo("198.51.100.25");
    }

    @Test
    void imageUploadVerifiesMagicBytesAndRejectsSpoofedContentType() {
        ImageUploadService service = new ImageUploadService("", "us-east-1", "", "", "", "");

        byte[] pngBytes = new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00 };
        MockMultipartFile validPng = new MockMultipartFile(
                "file", "photo.exe", "application/octet-stream", pngBytes);
        String uploadedPng = service.uploadImage(validPng, "diary/1");
        assertThat(uploadedPng).startsWith("data:image/png;base64,");

        byte[] jpegBytes = new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0 };
        MockMultipartFile validJpeg = new MockMultipartFile(
                "file", "poster.jpg", "image/jpeg", jpegBytes);
        assertThat(service.uploadImage(validJpeg, "diary/1")).startsWith("data:image/jpeg;base64,");

        MockMultipartFile fakePng = new MockMultipartFile(
                "file", "evil.png", "image/png", "<script>alert(1)</script>".getBytes(StandardCharsets.UTF_8));
        assertThatThrownBy(() -> service.uploadImage(fakePng, "diary/1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("지원하지 않는 파일 형식");
    }
}
