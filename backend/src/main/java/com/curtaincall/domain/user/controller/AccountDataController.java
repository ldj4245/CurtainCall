package com.curtaincall.domain.user.controller;
import com.curtaincall.domain.user.service.AccountDataService;
import com.curtaincall.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequiredArgsConstructor
public class AccountDataController {
    private final AccountDataService service;
    public record Confirmation(String confirmation) {}
    @DeleteMapping("/api/users/me") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Long user, @RequestBody Confirmation c) {
        if (!"탈퇴".equals(c.confirmation())) throw BusinessException.badRequest("확인란에 탈퇴를 입력해 주세요.");
        service.erase(user);
    }
}
