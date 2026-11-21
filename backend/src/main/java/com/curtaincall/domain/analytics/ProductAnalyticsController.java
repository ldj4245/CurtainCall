package com.curtaincall.domain.analytics;

import com.curtaincall.domain.diary.repository.DiaryEntryRepository;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.domain.plan.ViewingPlanRepository;
import com.curtaincall.global.exception.BusinessException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.scheduling.annotation.Scheduled;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController @RequiredArgsConstructor
public class ProductAnalyticsController {
    private final ProductEventRepository events;
    private final UserRepository users;
    private final DiaryEntryRepository diaries;
    private final ViewingPlanRepository plans;
    private static final Set<String> ALLOWED = Set.of("show_view", "diary_start", "signup_complete", "diary_saved", "diary_save_failed", "plan_saved", "share_link_created", "shared_record_opened");
    public record Event(@NotBlank String name, @Pattern(regexp = "[0-9a-fA-F-]{36}") @NotNull String sessionId, @Positive Long showId) {}
    @PostMapping("/api/events") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT) @Transactional
    public void event(@AuthenticationPrincipal Long user, @Valid @RequestBody Event event) {
        if (!ALLOWED.contains(event.name())) throw BusinessException.badRequest("등록되지 않은 이벤트입니다.");
        if (events.countBySessionIdAndCreatedAtAfter(event.sessionId(), LocalDateTime.now().minusHours(1)) >= 120) return;
        events.save(ProductEvent.builder().name(event.name()).sessionId(event.sessionId()).userId(user).showId(event.showId()).build());
    }
    @GetMapping("/api/admin/metrics") @Transactional(readOnly = true)
    public Map<String, Object> metrics() {
        var now = LocalDateTime.now();
        var allUsers = users.findAll();
        long firstEligible = 0, firstSaved = 0, repeatEligible = 0, repeated = 0;
        for (var user : allUsers) {
            if (user.isDeactivated()) continue;
            var records = diaries.findAllByUserIdWithShow(user.getId()).stream().sorted(Comparator.comparing(d -> d.getCreatedAt())).toList();
            if (user.getCreatedAt().isBefore(now.minusHours(24))) {
                firstEligible++;
                if (records.stream().anyMatch(d -> !d.getCreatedAt().isAfter(user.getCreatedAt().plusHours(24)))) firstSaved++;
            }
            if (!records.isEmpty() && records.get(0).getCreatedAt().isBefore(now.minusDays(30))) {
                repeatEligible++;
                if (records.size() > 1 && !records.get(1).getCreatedAt().isAfter(records.get(0).getCreatedAt().plusDays(30))) repeated++;
            }
        }
        var allPlans = plans.findAll();
        return Map.of("first24hEligible", firstEligible, "first24hSaved", firstSaved,
            "repeat30dEligible", repeatEligible, "repeat30dSaved", repeated,
            "plans", allPlans.size(), "completedPlans", allPlans.stream().filter(p -> p.getDiaryId() != null).count(),
            "events90d", events.findByCreatedAtAfter(now.minusDays(90)).stream().collect(Collectors.groupingBy(ProductEvent::getName, Collectors.counting())));
    }
    @Scheduled(cron = "0 15 3 * * *", zone = "Asia/Seoul") @Transactional
    public void purge() { events.deleteByCreatedAtBefore(LocalDateTime.now().minusDays(90)); }
}
