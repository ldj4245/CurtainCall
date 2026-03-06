package com.curtaincall.domain.casting.dto;

import com.curtaincall.domain.casting.entity.CastMember;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
@Builder
public class CastingResponse {

    private String roleName;
    private List<ActorInfo> actors;

    @Getter
    @Builder
    public static class ActorInfo {
        private String name;
        private String imageUrl;
    }

    public static List<CastingResponse> from(List<CastMember> castMembers) {
        Map<String, List<CastMember>> grouped = castMembers.stream()
                .collect(Collectors.groupingBy(
                        cm -> cm.getRoleName() != null ? cm.getRoleName() : "출연",
                        java.util.LinkedHashMap::new,
                        Collectors.toList()));

        return grouped.entrySet().stream()
                .map(entry -> CastingResponse.builder()
                        .roleName(entry.getKey())
                        .actors(entry.getValue().stream()
                                .map(cm -> ActorInfo.builder()
                                        .name(cm.getActorName())
                                        .imageUrl(cm.getActorImageUrl())
                                        .build())
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
    }
}
