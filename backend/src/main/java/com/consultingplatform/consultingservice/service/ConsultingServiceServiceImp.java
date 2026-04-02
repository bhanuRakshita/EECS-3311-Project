package com.consultingplatform.consultingservice.service;

import org.springframework.stereotype.Service;

import com.consultingplatform.admin.domain.PricingStrategyConfig;
import com.consultingplatform.admin.service.SystemPolicyService;
import com.consultingplatform.consultingservice.domain.ConsultingService;
import com.consultingplatform.consultingservice.repository.ConsultingServiceRepository;
import com.consultingplatform.consultingservice.service.pricing.PricingStrategy;
import com.consultingplatform.consultingservice.service.pricing.PricingStrategyFactory;
import com.consultingplatform.consultingservice.web.dto.ConsultingServiceDto;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ConsultingServiceServiceImp implements ConsultingServiceService{
    
    private final ConsultingServiceRepository consultingServiceRepository;
    private final SystemPolicyService systemPolicyService;
    private final PricingStrategyFactory pricingStrategyFactory;

    public ConsultingServiceServiceImp(ConsultingServiceRepository consultingServiceRepository,
                                       SystemPolicyService systemPolicyService,
                                       PricingStrategyFactory pricingStrategyFactory) {
        this.consultingServiceRepository = consultingServiceRepository;
        this.systemPolicyService = systemPolicyService;
        this.pricingStrategyFactory = pricingStrategyFactory;
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
    
    @Override
    public List<ConsultingService> getAllActiveServices(String serviceType) {
        List<ConsultingService> services;
        if (serviceType != null && !serviceType.trim().isEmpty()) {
            services = consultingServiceRepository.findByServiceTypeAndIsActiveTrue(serviceType);
        } else {
            services = consultingServiceRepository.findByIsActiveTrue();
        }
        return services.stream().map(this::applyPricingStrategy).collect(Collectors.toList());
    }

    @Override
    public ConsultingService getServiceById(Long id) {
        return consultingServiceRepository.findById(id)
                .map(this::applyPricingStrategy)
                .orElse(null);
    }

    private ConsultingService applyPricingStrategy(ConsultingService service) {
        Optional<PricingStrategyConfig> configOpt = systemPolicyService.getPolicyConfig("PRICING_STRATEGY", PricingStrategyConfig.class);
        
        if (configOpt.isPresent()) {
            PricingStrategyConfig config = configOpt.get();
            PricingStrategy strategy = pricingStrategyFactory.getStrategy(config.getStrategyType());
            java.math.BigDecimal newPrice = strategy.calculatePrice(service.getBasePrice(), config);
            
            service.setBasePrice(newPrice);
        }
        return service;
    }
}
