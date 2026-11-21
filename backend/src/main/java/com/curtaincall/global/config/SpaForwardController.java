package com.curtaincall.global.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaForwardController {

    @RequestMapping(value = {
        "/shows",
        "/shows/**",
        "/community",
        "/community/**",
        "/diary",
        "/diary/**",
        "/mypage",
        "/mypage/**",
        "/login",
        "/signup", "/my", "/plans", "/notifications", "/shared/**",
        "/oauth2/callback"
    })
    public String forwardSpaRoutes(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri.startsWith("/api") || uri.startsWith("/swagger") || uri.startsWith("/api-docs")) {
            return null;
        }
        return "forward:/index.html";
    }
}
