package com.curtaincall.domain.community.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CommunityLikeResponse {

    private boolean liked;
    private int likeCount;
}
