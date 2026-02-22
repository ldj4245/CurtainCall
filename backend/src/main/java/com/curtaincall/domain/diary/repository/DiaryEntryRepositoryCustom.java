package com.curtaincall.domain.diary.repository;

import com.curtaincall.domain.diary.dto.DiaryStatsDto;

public interface DiaryEntryRepositoryCustom {
    DiaryStatsDto getStatsByUserId(Long userId);
}
