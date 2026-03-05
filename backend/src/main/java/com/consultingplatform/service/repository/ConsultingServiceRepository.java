package com.consultingplatform.service.repository;

import com.consultingplatform.service.domain.ConsultingService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsultingServiceRepository extends JpaRepository<ConsultingService, Long> {
    
    List<ConsultingService> findByIsActiveTrue();
    
    List<ConsultingService> findByConsultantIdAndIsActiveTrue(Long consultantId);
    
    List<ConsultingService> findByServiceTypeAndIsActiveTrue(String serviceType);
}
