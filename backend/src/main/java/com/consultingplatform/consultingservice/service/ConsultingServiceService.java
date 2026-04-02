package com.consultingplatform.consultingservice.service;

import com.consultingplatform.consultingservice.domain.ConsultingService;
import com.consultingplatform.consultingservice.web.dto.ConsultingServiceDto;
import java.util.List;

public interface ConsultingServiceService {
    ConsultingService createService(ConsultingServiceDto serviceDto);
    List<ConsultingService> getAllActiveServices(String serviceType);
    ConsultingService getServiceById(Long id);
}
