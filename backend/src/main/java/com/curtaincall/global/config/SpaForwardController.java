package com.curtaincall.global.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaForwardController {

    @RequestMapping(value = {
        "/shows",
        "/shows/**",
        "/diary",
        "/diary/**",
        "/mypage",
        "/mypage/**",
        "/chat",
        "/chat/**",
        "/login",
        "/signup",
        "/{path:[^\\.]*}",
        "/*/{subpath:[^\\.]*}"
    })
    public String forwardSpaRoutes(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri.startsWith("/api") || uri.startsWith("/ws") || uri.startsWith("/swagger") || uri.startsWith("/api-docs")) {
            return null;
        }
        return "forward:/index.html";
    }
}
