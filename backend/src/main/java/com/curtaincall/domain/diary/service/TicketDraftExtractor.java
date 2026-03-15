package com.curtaincall.domain.diary.service;

import org.springframework.web.multipart.MultipartFile;

public interface TicketDraftExtractor {

    TicketDraftExtractionResult extract(MultipartFile file);
}
