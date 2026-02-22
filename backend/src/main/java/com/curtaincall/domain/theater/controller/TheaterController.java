package com.curtaincall.domain.theater.controller;

import com.curtaincall.domain.theater.dto.TheaterResponse;
import com.curtaincall.domain.theater.service.TheaterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "극장", description = "극장 정보 API")
@RestController
@RequestMapping("/api/theaters")
@RequiredArgsConstructor
public class TheaterController {

    private final TheaterService theaterService;

    @Operation(summary = "극장 목록 조회")
    @GetMapping
    public ResponseEntity<List<TheaterResponse>> getAllTheaters() {
        return ResponseEntity.ok(theaterService.getAllTheaters());
    }
}
