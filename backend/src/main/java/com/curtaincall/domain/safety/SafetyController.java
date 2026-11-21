package com.curtaincall.domain.safety;

import com.curtaincall.domain.chat.repository.ChatMessageRepository;
import com.curtaincall.domain.companion.repository.CompanionParticipantRepository;
import com.curtaincall.domain.showlive.repository.ShowLiveMessageRepository;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.exception.BusinessException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.*;
import java.util.List;

@RestController @RequiredArgsConstructor @Transactional
public class SafetyController {
    private final UserBlockRepository blocks;
    private final ContentReportRepository reports;
    private final ChatMessageRepository chats;
    private final ShowLiveMessageRepository live;
    private final CompanionParticipantRepository participants;
    private final UserRepository users;
    public record Report(@NotBlank String type, @NotNull Long targetId, @NotBlank @Size(max = 500) String reason) {}
    @GetMapping("/api/blocks") public List<UserBlock> blocks(@AuthenticationPrincipal Long user) { return blocks.findByUserId(user); }
    @PutMapping("/api/blocks/{id}") public void block(@AuthenticationPrincipal Long user, @PathVariable Long id) {
        users.lockById(user).orElseThrow();
        if (user.equals(id) || !users.existsById(id)) throw BusinessException.badRequest("차단할 사용자를 확인해 주세요.");
        if (!blocks.existsByUserIdAndBlockedUserId(user, id)) blocks.save(UserBlock.builder().userId(user).blockedUserId(id).build());
    }
    @DeleteMapping("/api/blocks/{id}") public void unblock(@AuthenticationPrincipal Long user, @PathVariable Long id) { blocks.deleteByUserIdAndBlockedUserId(user, id); }
    @PostMapping("/api/reports") public void report(@AuthenticationPrincipal Long user, @Valid @RequestBody Report r) {
        String evidence; Long author;
        if ("CHAT".equals(r.type())) {
            var m = chats.findById(r.targetId()).orElseThrow(() -> BusinessException.notFound("메시지를 찾을 수 없습니다."));
            if (!participants.existsByCompanionPostIdAndUserId(m.getRoom().getCompanionPost().getId(), user)) throw BusinessException.forbidden("참여 중인 채팅방만 신고할 수 있습니다.");
            evidence = m.getContent(); author = m.getSender().getId();
        } else if ("LIVE".equals(r.type())) {
            var m = live.findById(r.targetId()).orElseThrow(() -> BusinessException.notFound("메시지를 찾을 수 없습니다."));
            evidence = m.getContent(); author = m.getSender().getId();
        } else throw BusinessException.badRequest("신고 유형을 확인해 주세요.");
        users.lockById(user).orElseThrow();
        if (!reports.existsByReporterIdAndTargetTypeAndTargetIdAndStatus(user, r.type(), r.targetId(), "OPEN"))
            reports.save(ContentReport.builder().reporterId(user).authorId(author).targetType(r.type()).targetId(r.targetId()).reason(r.reason()).evidence(evidence == null ? "" : evidence.substring(0, Math.min(evidence.length(), 2000))).build());
    }
    @GetMapping("/api/admin/reports") public Page<ContentReport> reports(@RequestParam(defaultValue = "0") int page) { return reports.findAllByOrderByCreatedAtDesc(PageRequest.of(Math.max(0, page), 20)); }
    public record Resolution(@Pattern(regexp = "DISMISSED|HIDDEN") String status) {}
    @PutMapping("/api/admin/reports/{id}") public void resolve(@PathVariable Long id, @Valid @RequestBody Resolution r) {
        var report = reports.findById(id).orElseThrow(() -> BusinessException.notFound("신고를 찾을 수 없습니다."));
        if (r.status() == null) throw BusinessException.badRequest("처리 결과가 필요합니다.");
        if ("HIDDEN".equals(r.status())) {
            if ("CHAT".equals(report.getTargetType())) chats.findById(report.getTargetId()).ifPresent(chats::delete);
            else live.findById(report.getTargetId()).ifPresent(live::delete);
        }
        report.resolve(r.status());
    }
}
