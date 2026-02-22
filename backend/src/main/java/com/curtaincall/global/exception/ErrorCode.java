package com.curtaincall.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Auth
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다"),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"),
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "비밀번호가 일치하지 않습니다"),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다"),
    SOCIAL_LOGIN_USER(HttpStatus.BAD_REQUEST, "소셜 로그인 사용자입니다. 소셜 로그인을 이용해주세요"),

    // Common
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다"),
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "잘못된 입력입니다"),

    // Show
    SHOW_NOT_FOUND(HttpStatus.NOT_FOUND, "공연을 찾을 수 없습니다"),

    // Review
    REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "리뷰를 찾을 수 없습니다"),
    DUPLICATE_REVIEW(HttpStatus.CONFLICT, "이미 리뷰를 작성하셨습니다"),

    // Diary
    DIARY_NOT_FOUND(HttpStatus.NOT_FOUND, "관람일지를 찾을 수 없습니다"),
    DIARY_ACCESS_DENIED(HttpStatus.FORBIDDEN, "접근 권한이 없습니다");

    private final HttpStatus status;
    private final String message;
}

