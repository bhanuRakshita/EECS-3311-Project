package com.consultingplatform.consultingservice.service;

import com.consultingplatform.consultingservice.domain.ConsultingService;
import com.consultingplatform.consultingservice.web.dto.ConsultingServiceDto;

public interface ConsultingServiceService {
    ConsultingService createService(ConsultingServiceDto serviceDto);
}
