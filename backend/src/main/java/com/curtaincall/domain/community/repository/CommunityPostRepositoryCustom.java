package com.curtaincall.domain.community.repository;

import com.curtaincall.domain.community.entity.CommunityPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CommunityPostRepositoryCustom {

    Page<CommunityPost> searchPosts(
            CommunityPost.Category category,
            Long showId,
            String keyword,
            String sort,
            Pageable pageable);
}
