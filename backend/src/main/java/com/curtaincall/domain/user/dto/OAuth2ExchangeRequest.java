package com.curtaincall.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class OAuth2ExchangeRequest {

    @NotBlank(message = "OAuth code는 필수입니다.")
    private String code;
}
