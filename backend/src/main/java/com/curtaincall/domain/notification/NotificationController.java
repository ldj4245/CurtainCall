package com.curtaincall.domain.notification;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@RestController @RequestMapping("/api/notifications") @RequiredArgsConstructor
public class NotificationController {
    private final NotificationService service;
    public record Preferences(boolean plans, boolean favorites, boolean replies, boolean monthly) {}
    @GetMapping public List<Notification> list(@AuthenticationPrincipal Long user) { return service.list(user); }
    @GetMapping("/preferences") public NotificationPreference preferences(@AuthenticationPrincipal Long user) { return service.preference(user); }
    @PutMapping("/preferences") @Transactional public void update(@AuthenticationPrincipal Long user, @RequestBody Preferences p) { service.preference(user).update(p.plans(), p.favorites(), p.replies(), p.monthly()); }
    @PutMapping("/{id}/seen") public void seen(@AuthenticationPrincipal Long user, @PathVariable Long id) { service.seen(user, id); }
}
