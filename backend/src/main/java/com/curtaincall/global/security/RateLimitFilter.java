package com.curtaincall.global.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * IP 기준 고정 윈도우(1분) API 요청 제한 필터.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private static final String RATE_LIMIT_BODY =
            "{\"status\":429,\"message\":\"요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.\"}";

    private final boolean enabled;
    private final Cache<String, AtomicInteger> counters = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .maximumSize(20_000)
            .build();

    public RateLimitFilter(boolean enabled) {
        this.enabled = enabled;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        LimitRule rule = resolveRule(request.getMethod(), request.getRequestURI());
        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = resolveClientIp(request);
        String key = rule.bucket() + ":" + clientIp;
        AtomicInteger counter = counters.get(key, ignored -> new AtomicInteger(0));
        if (counter.incrementAndGet() > rule.limitPerMinute()) {
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.setContentType("application/json;charset=UTF-8");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write(RATE_LIMIT_BODY);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static LimitRule resolveRule(String method, String uri) {
        if (uri == null || !uri.startsWith("/api/")) {
            return null;
        }

        if ("POST".equalsIgnoreCase(method) && (
                "/api/auth/login".equals(uri)
                        || "/api/auth/signup".equals(uri)
                        || "/api/auth/refresh".equals(uri)
                        || "/api/auth/oauth2/exchange".equals(uri))) {
            return new LimitRule("AUTH_SENSITIVE", 15);
        }
        if ("GET".equalsIgnoreCase(method) && "/api/auth/check-email".equals(uri)) {
            return new LimitRule("AUTH_CHECK", 20);
        }
        if ("POST".equalsIgnoreCase(method) && "/api/events".equals(uri)) {
            return new LimitRule("ANALYTICS", 60);
        }
        if ("POST".equalsIgnoreCase(method) && "/api/diary/images".equals(uri)) {
            return new LimitRule("UPLOAD", 20);
        }
        if (isWriteMethod(method) && isContentWritePath(uri)) {
            return new LimitRule("WRITE_CONTENT", 40);
        }

        return new LimitRule("GENERAL_API", 180);
    }

    private static boolean isWriteMethod(String method) {
        return "POST".equalsIgnoreCase(method)
                || "PUT".equalsIgnoreCase(method)
                || "PATCH".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method);
    }

    private static boolean isContentWritePath(String uri) {
        return uri.startsWith("/api/community/")
                || uri.startsWith("/api/reviews/")
                || (uri.startsWith("/api/shows/") && uri.contains("/reviews"))
                || uri.startsWith("/api/diary")
                || uri.startsWith("/api/plans")
                || uri.startsWith("/api/favorites");
    }

    static String resolveClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (isLoopback(remoteAddr)) {
            String realClientIp = firstIp(request.getHeader("X-Real-Client-IP"));
            if (realClientIp != null) {
                return realClientIp;
            }
            String forwardedFor = firstIp(request.getHeader("X-Forwarded-For"));
            if (forwardedFor != null) {
                return forwardedFor;
            }
        }
        return remoteAddr != null ? remoteAddr : "unknown";
    }

    private static boolean isLoopback(String addr) {
        return "127.0.0.1".equals(addr)
                || "::1".equals(addr)
                || "0:0:0:0:0:0:0:1".equals(addr);
    }

    private static String firstIp(String headerValue) {
        if (headerValue == null || headerValue.isBlank()) {
            return null;
        }
        int comma = headerValue.indexOf(',');
        String candidate = (comma >= 0 ? headerValue.substring(0, comma) : headerValue).trim();
        if (candidate.isEmpty() || candidate.length() > 64) {
            return null;
        }
        return candidate;
    }

    private record LimitRule(String bucket, int limitPerMinute) {}
}
