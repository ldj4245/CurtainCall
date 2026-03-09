package com.curtaincall.domain.show.dto;

import com.curtaincall.domain.show.entity.Show;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ShowAutocompleteResponse {

    private Long id;
    private String title;
    private String posterUrl;
    private String genre;
    private String status;

    public static ShowAutocompleteResponse from(Show show) {
        return ShowAutocompleteResponse.builder()
                .id(show.getId())
                .title(show.getTitle())
                .posterUrl(show.getPosterUrl())
                .genre(show.getGenre() != null ? show.getGenre().name() : null)
                .status(show.getStatus() != null ? show.getStatus().name() : null)
                .build();
    }
}
