package com.consultingplatform.consultingservice.service;

import org.springframework.stereotype.Service;

import com.consultingplatform.consultingservice.domain.ConsultingService;
import com.consultingplatform.consultingservice.repository.ConsultingServiceRepository;
import com.consultingplatform.consultingservice.web.dto.ConsultingServiceDto;

@Service
public class ConsultingServiceServiceImp implements ConsultingServiceService{
    
    //To talk to the db
    private final ConsultingServiceRepository consultingServiceRepository;

    // Constructor injection is visually cleaner and recommended by Spring
    public ConsultingServiceServiceImp(ConsultingServiceRepository consultingServiceRepository) {
        this.consultingServiceRepository = consultingServiceRepository;
    }
    
    @Override
    public ConsultingService createService(ConsultingServiceDto serviceDto) {
        ConsultingService service = new ConsultingService();
        
        service.setServiceType(serviceDto.getServiceType());
        service.setTitle(serviceDto.getTitle());
        service.setDescription(serviceDto.getDescription());
        service.setDurationMinutes(serviceDto.getDurationMinutes());
        service.setBasePrice(serviceDto.getBasePrice());
        service.setIsActive(true); 
        
        return consultingServiceRepository.save(service);
    }
    
}
