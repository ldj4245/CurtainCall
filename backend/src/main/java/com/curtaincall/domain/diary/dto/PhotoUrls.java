package com.curtaincall.domain.diary.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Arrays;

/** JSON storage; also reads legacy comma-separated URLs and base64 data URLs. */
public final class PhotoUrls {
    private static final ObjectMapper JSON = new ObjectMapper();
    private PhotoUrls() {}

    public static List<String> read(String value) {
        if (value == null || value.isBlank()) return List.of();
        if (value.stripLeading().startsWith("[")) {
            try { return JSON.readValue(value, new TypeReference<List<String>>() {}); }
            catch (Exception e) { throw new IllegalStateException("사진 목록을 읽을 수 없습니다.", e); }
        }
        // A base64 URL's first comma belongs to its media header, not a separator.
        return Arrays.stream(value.split(",(?=(?:https?://|data:))"))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    public static String write(List<String> values) {
        try { return JSON.writeValueAsString(values == null ? List.of() : values); }
        catch (Exception e) { throw new IllegalArgumentException("사진 목록을 저장할 수 없습니다.", e); }
    }
}
