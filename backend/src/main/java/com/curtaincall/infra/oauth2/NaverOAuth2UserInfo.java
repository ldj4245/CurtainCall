package com.curtaincall.infra.oauth2;

import com.curtaincall.domain.user.entity.SocialAccount;

import java.util.Map;

@SuppressWarnings("unchecked")
public class NaverOAuth2UserInfo extends OAuth2UserInfo {

    public NaverOAuth2UserInfo(Map<String, Object> attributes) {
        super((Map<String, Object>) attributes.get("response"));
    }

    @Override
    public String getId() {
        return (String) attributes.get("id");
    }

    @Override
    public String getName() {
        return (String) attributes.get("name");
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    @Override
    public String getImageUrl() {
        return (String) attributes.get("profile_image");
    }

    @Override
    public SocialAccount.Provider getProvider() {
        return SocialAccount.Provider.NAVER;
    }
}
