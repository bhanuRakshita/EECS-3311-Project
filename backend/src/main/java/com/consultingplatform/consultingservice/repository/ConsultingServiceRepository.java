package com.consultingplatform.consultingservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.consultingplatform.consultingservice.domain.ConsultingService;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultingServiceRepository extends JpaRepository<ConsultingService, Long> {
    
    List<ConsultingService> findByIsActiveTrue();
    
    List<ConsultingService> findByServiceTypeAndIsActiveTrue(String serviceType);

}
