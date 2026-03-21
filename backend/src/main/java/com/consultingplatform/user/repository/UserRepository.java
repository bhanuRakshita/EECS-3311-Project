package com.consultingplatform.user.repository;

import com.consultingplatform.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
	java.util.Optional<User> findByEmail(String email);
}
