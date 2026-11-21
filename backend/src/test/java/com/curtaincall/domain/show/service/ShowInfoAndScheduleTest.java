package com.curtaincall.domain.show.service;

import com.curtaincall.domain.show.dto.ShowResponse;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.theater.RegionNormalizer;
import com.curtaincall.domain.theater.entity.Theater;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ShowInfoAndScheduleTest {

    @Test
    void regionNormalizerMapsFullNamesAndAddresses() {
        assertThat(RegionNormalizer.normalize(null, "서울특별시 종로구 대학로14길 29(혜화동)")).isEqualTo("서울");
        assertThat(RegionNormalizer.normalize("", "인천광역시 남동구 예술로 149")).isEqualTo("인천");
        assertThat(RegionNormalizer.normalize("경기도", null)).isEqualTo("경기");
        assertThat(RegionNormalizer.normalize("전북특별자치도", null)).isEqualTo("전북");
        assertThat(RegionNormalizer.normalize("서울", "서울특별시 강남구")).isEqualTo("서울");
        assertThat(RegionNormalizer.normalize(" ", " ")).isNull();
    }

    @Test
    void extractTimesHandlesWeekdayRangesCommaListsAndIgnoresHol() {
        String pattern1 = "수요일(15:00), 목요일(19:30), 토요일 ~ 일요일(14:00,18:00), HOL(14:00,18:00)";
        assertThat(ShowService.extractTimesForDate(pattern1, LocalDate.of(2026, 11, 18)))
                .containsExactly("15:00");
        assertThat(ShowService.extractTimesForDate(pattern1, LocalDate.of(2026, 11, 21)))
                .containsExactly("14:00", "18:00");
        assertThat(ShowService.extractTimesForDate(pattern1, LocalDate.of(2026, 11, 22)))
                .containsExactly("14:00", "18:00");

        // HOL 단독 구간이 일요일("일")로 오인되지 않는지 확인
        String holOnlyOnSunday = "토요일(15:00), HOL(14:00,18:00)";
        assertThat(ShowService.extractTimesForDate(holOnlyOnSunday, LocalDate.of(2026, 11, 22)))
                .isEmpty();

        // 쉼표 구분 요일 목록 파싱 확인
        String commaDays = "화, 수, 목(19:30)";
        assertThat(ShowService.extractTimesForDate(commaDays, LocalDate.of(2026, 11, 17)))
                .containsExactly("19:30");
        assertThat(ShowService.extractTimesForDate(commaDays, LocalDate.of(2026, 11, 18)))
                .containsExactly("19:30");
        assertThat(ShowService.extractTimesForDate(commaDays, LocalDate.of(2026, 11, 20)))
                .isEmpty();

        // 평일이 일요일("일")로 오인되지 않는지 확인
        String weekdayOnly = "평일(19:30)";
        assertThat(ShowService.extractTimesForDate(weekdayOnly, LocalDate.of(2026, 11, 16)))
                .containsExactly("19:30");
        assertThat(ShowService.extractTimesForDate(weekdayOnly, LocalDate.of(2026, 11, 22)))
                .isEmpty();
    }

    @Test
    void showResponseNormalizesRegionBlanksAndBookingLinks() {
        Theater theater = Theater.builder()
                .kopisId("FC003244")
                .name("링크아트센터")
                .address("서울특별시 종로구 대학로14길 29")
                .region(null)
                .seatScale(860)
                .build();

        Show show = Show.builder()
                .id(76L)
                .kopisId("PF297978")
                .title("꽃의 비밀 [대학로]")
                .genre(Show.Genre.PLAY)
                .status(Show.Status.ONGOING)
                .theater(theater)
                .runtime("   ")
                .dtguidance("토요일 ~ 일요일(14:00,18:00)")
                .bookingLinks("[{\"name\":\"NOL 티켓(인터파크)\",\"url\":\"https://ticket.interpark.com/1\"}]")
                .build();

        ShowResponse dto = ShowResponse.from(show);
        assertThat(dto.getTheaterRegion()).isEqualTo("서울");
        assertThat(dto.getRuntime()).isNull();
        assertThat(dto.getDtguidance()).isEqualTo("토요일 ~ 일요일(14:00,18:00)");
        assertThat(dto.getBookingLinks())
                .hasSize(1)
                .extracting(ShowResponse.BookingLinkItem::getName, ShowResponse.BookingLinkItem::getUrl)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("NOL 티켓(인터파크)", "https://ticket.interpark.com/1"));
    }
}
