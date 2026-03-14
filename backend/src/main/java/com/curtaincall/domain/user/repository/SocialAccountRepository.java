package com.curtaincall.domain.user.repository;

import com.curtaincall.domain.user.entity.SocialAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SocialAccountRepository extends JpaRepository<SocialAccount, Long> {
    Optional<SocialAccount> findByProviderAndProviderId(SocialAccount.Provider provider, String providerId);
    Optional<SocialAccount> findByUserIdAndProvider(Long userId, SocialAccount.Provider provider);
}
