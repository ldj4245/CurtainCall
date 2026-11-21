package com.curtaincall.domain.plan;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/plans") @RequiredArgsConstructor
public class ViewingPlanController {
    private final ViewingPlanService service;
    @GetMapping public List<ViewingPlanService.Response> list(@AuthenticationPrincipal Long user) { return service.list(user); }
    @PostMapping public ViewingPlanService.Response create(@AuthenticationPrincipal Long user, @Valid @RequestBody ViewingPlanService.Request request) { return service.save(user, null, request); }
    @PutMapping("/{id}") public ViewingPlanService.Response update(@AuthenticationPrincipal Long user, @PathVariable Long id, @Valid @RequestBody ViewingPlanService.Request request) { return service.save(user, id, request); }
    @DeleteMapping("/{id}") public void delete(@AuthenticationPrincipal Long user, @PathVariable Long id) { service.delete(user, id); }
}
