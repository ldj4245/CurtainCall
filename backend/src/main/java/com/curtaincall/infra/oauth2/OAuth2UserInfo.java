package com.curtaincall.infra.oauth2;

import com.curtaincall.domain.user.entity.SocialAccount;

import java.util.Map;

public abstract class OAuth2UserInfo {

    protected Map<String, Object> attributes;

    public OAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public abstract String getId();
    public abstract String getName();
    public abstract String getEmail();
    public abstract String getImageUrl();
    public abstract SocialAccount.Provider getProvider();

    public static OAuth2UserInfo of(String registrationId, Map<String, Object> attributes) {
        return switch (registrationId) {
            case "kakao" -> new KakaoOAuth2UserInfo(attributes);
            case "naver" -> new NaverOAuth2UserInfo(attributes);
            case "google" -> new GoogleOAuth2UserInfo(attributes);
            default -> throw new IllegalArgumentException("Unsupported provider: " + registrationId);
        };
    }
}
