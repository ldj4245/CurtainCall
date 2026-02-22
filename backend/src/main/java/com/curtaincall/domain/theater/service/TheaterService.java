package com.curtaincall.domain.theater.service;

import com.curtaincall.domain.theater.dto.TheaterResponse;
import com.curtaincall.domain.theater.repository.TheaterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TheaterService {

    private final TheaterRepository theaterRepository;

    public List<TheaterResponse> getAllTheaters() {
        return theaterRepository.findAll().stream()
                .map(TheaterResponse::from).toList();
    }
}
