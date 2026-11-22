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
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final Set<String> ALLOWED = Set.of("page_view", "show_view", "diary_start", "signup_complete", "diary_saved", "diary_save_failed", "plan_saved", "share_link_created", "shared_record_opened");
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
        Map<Long, List<LocalDateTime>> diaryTimesByUser = new HashMap<>();
        for (var row : diaries.findAllUserCreatedAt()) {
            diaryTimesByUser.computeIfAbsent(row.getUserId(), k -> new ArrayList<>()).add(row.getCreatedAt());
        }
        long firstEligible = 0, firstSaved = 0, repeatEligible = 0, repeated = 0;
        for (var user : allUsers) {
            if (user.isDeactivated()) continue;
            var records = diaryTimesByUser.getOrDefault(user.getId(), List.of());
            if (user.getCreatedAt().isBefore(now.minusHours(24))) {
                firstEligible++;
                if (records.stream().anyMatch(createdAt -> !createdAt.isAfter(user.getCreatedAt().plusHours(24)))) firstSaved++;
            }
            if (!records.isEmpty() && records.get(0).isBefore(now.minusDays(30))) {
                repeatEligible++;
                if (records.size() > 1 && !records.get(1).isAfter(records.get(0).plusDays(30))) repeated++;
            }
        }
        long totalPlans = plans.count();
        long completedPlans = plans.countByDiaryIdIsNotNull();
        Map<String, Long> events90d = events.countByNameAfter(now.minusDays(90)).stream()
                .collect(Collectors.toMap(ProductEventRepository.EventCount::getName, ProductEventRepository.EventCount::getCount));

        LocalDate todayKst = LocalDate.now(KST);
        ZoneId defaultZone = ZoneId.systemDefault();
        LocalDateTime todayStart = todayKst.atStartOfDay(KST).withZoneSameInstant(defaultZone).toLocalDateTime();
        LocalDateTime weekStart = todayKst.minusDays(6).atStartOfDay(KST).withZoneSameInstant(defaultZone).toLocalDateTime();
        LocalDateTime monthStart = todayKst.minusDays(29).atStartOfDay(KST).withZoneSameInstant(defaultZone).toLocalDateTime();

        long visitorsToday = events.countDistinctSessionsSince(todayStart);
        long visitors7d = events.countDistinctSessionsSince(weekStart);
        long visitors30d = events.countDistinctSessionsSince(monthStart);
        long pageViewsToday = events.countByNameSince("page_view", todayStart);

        Map<LocalDate, Set<String>> dailySessions = new LinkedHashMap<>();
        Map<LocalDate, Long> dailyViews = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = todayKst.minusDays(i);
            dailySessions.put(day, new HashSet<>());
            dailyViews.put(day, 0L);
        }
        for (var e : events.findRecentEventsSince(weekStart)) {
            if (e.getCreatedAt() == null) continue;
            LocalDate day = e.getCreatedAt().atZone(defaultZone).withZoneSameInstant(KST).toLocalDate();
            if (!dailySessions.containsKey(day)) continue;
            dailySessions.get(day).add(e.getSessionId());
            if ("page_view".equals(e.getName())) {
                dailyViews.merge(day, 1L, Long::sum);
            }
        }
        List<Map<String, Object>> dailyVisitors = dailySessions.entrySet().stream()
                .map(entry -> Map.<String, Object>of(
                        "date", entry.getKey().toString(),
                        "visitors", entry.getValue().size(),
                        "pageViews", dailyViews.getOrDefault(entry.getKey(), 0L)))
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("visitorsToday", visitorsToday);
        result.put("visitors7d", visitors7d);
        result.put("visitors30d", visitors30d);
        result.put("pageViewsToday", pageViewsToday);
        result.put("dailyVisitors", dailyVisitors);
        result.put("first24hEligible", firstEligible);
        result.put("first24hSaved", firstSaved);
        result.put("repeat30dEligible", repeatEligible);
        result.put("repeat30dSaved", repeated);
        result.put("plans", totalPlans);
        result.put("completedPlans", completedPlans);
        result.put("events90d", events90d);
        return result;
    }
    @Scheduled(cron = "0 15 3 * * *", zone = "Asia/Seoul") @Transactional
    public void purge() { events.deleteByCreatedAtBefore(LocalDateTime.now().minusDays(90)); }
}
