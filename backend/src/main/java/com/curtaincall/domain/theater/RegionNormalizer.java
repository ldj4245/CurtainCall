package com.curtaincall.domain.theater;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * KOPIS 극장 지역(sidonm) 및 도로명 주소 앞자리를 검색/시간표 필터용 표준 지역명으로 정규화합니다.
 */
public final class RegionNormalizer {

    private static final Map<String, String> PREFIX_TO_STANDARD = new LinkedHashMap<>();

    static {
        PREFIX_TO_STANDARD.put("서울특별시", "서울");
        PREFIX_TO_STANDARD.put("서울시", "서울");
        PREFIX_TO_STANDARD.put("서울", "서울");
        PREFIX_TO_STANDARD.put("경기도", "경기");
        PREFIX_TO_STANDARD.put("경기", "경기");
        PREFIX_TO_STANDARD.put("인천광역시", "인천");
        PREFIX_TO_STANDARD.put("인천시", "인천");
        PREFIX_TO_STANDARD.put("인천", "인천");
        PREFIX_TO_STANDARD.put("부산광역시", "부산");
        PREFIX_TO_STANDARD.put("부산시", "부산");
        PREFIX_TO_STANDARD.put("부산", "부산");
        PREFIX_TO_STANDARD.put("대구광역시", "대구");
        PREFIX_TO_STANDARD.put("대구시", "대구");
        PREFIX_TO_STANDARD.put("대구", "대구");
        PREFIX_TO_STANDARD.put("대전광역시", "대전");
        PREFIX_TO_STANDARD.put("대전시", "대전");
        PREFIX_TO_STANDARD.put("대전", "대전");
        PREFIX_TO_STANDARD.put("광주광역시", "광주");
        PREFIX_TO_STANDARD.put("광주시", "광주");
        PREFIX_TO_STANDARD.put("광주", "광주");
        PREFIX_TO_STANDARD.put("울산광역시", "울산");
        PREFIX_TO_STANDARD.put("울산시", "울산");
        PREFIX_TO_STANDARD.put("울산", "울산");
        PREFIX_TO_STANDARD.put("세종특별자치시", "세종");
        PREFIX_TO_STANDARD.put("세종시", "세종");
        PREFIX_TO_STANDARD.put("세종", "세종");
        PREFIX_TO_STANDARD.put("강원특별자치도", "강원");
        PREFIX_TO_STANDARD.put("강원도", "강원");
        PREFIX_TO_STANDARD.put("강원", "강원");
        PREFIX_TO_STANDARD.put("충청북도", "충북");
        PREFIX_TO_STANDARD.put("충북", "충북");
        PREFIX_TO_STANDARD.put("충청남도", "충남");
        PREFIX_TO_STANDARD.put("충남", "충남");
        PREFIX_TO_STANDARD.put("전북특별자치도", "전북");
        PREFIX_TO_STANDARD.put("전라북도", "전북");
        PREFIX_TO_STANDARD.put("전북", "전북");
        PREFIX_TO_STANDARD.put("전라남도", "전남");
        PREFIX_TO_STANDARD.put("전남", "전남");
        PREFIX_TO_STANDARD.put("경상북도", "경북");
        PREFIX_TO_STANDARD.put("경북", "경북");
        PREFIX_TO_STANDARD.put("경상남도", "경남");
        PREFIX_TO_STANDARD.put("경남", "경남");
        PREFIX_TO_STANDARD.put("제주특별자치도", "제주");
        PREFIX_TO_STANDARD.put("제주도", "제주");
        PREFIX_TO_STANDARD.put("제주", "제주");
    }

    private RegionNormalizer() {
    }

    public static String normalize(String region, String address) {
        String candidate = firstNonBlank(region, firstToken(address));
        if (candidate == null) {
            return null;
        }
        for (Map.Entry<String, String> entry : PREFIX_TO_STANDARD.entrySet()) {
            if (candidate.startsWith(entry.getKey())) {
                return entry.getValue();
            }
        }
        return candidate;
    }

    private static String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary.trim();
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback.trim();
        }
        return null;
    }

    private static String firstToken(String address) {
        if (address == null || address.isBlank()) {
            return null;
        }
        return address.trim().split("\\s+")[0];
    }
}
