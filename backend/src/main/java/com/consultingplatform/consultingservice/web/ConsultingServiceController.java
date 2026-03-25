package com.consultingplatform.consultingservice.web;

import com.consultingplatform.consultingservice.domain.ConsultingService;
import com.consultingplatform.consultingservice.repository.ConsultingServiceRepository;
import com.consultingplatform.consultant.service.ConsultantService;
import com.consultingplatform.consultant.web.dto.AvailabilitySlotResponse;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/api/services")
public class ConsultingServiceController {

    private final ConsultingServiceRepository serviceRepository;
    private final ConsultantService consultantService;

    public ConsultingServiceController(ConsultingServiceRepository serviceRepository,
                                       ConsultantService consultantService) {
        this.serviceRepository = serviceRepository;
        this.consultantService = consultantService;
    }

    /**
     * UC1: Browse all active consulting services
     */
    @GetMapping
    public List<ConsultingService> getAllActiveServices(
            @RequestParam(required = false) String serviceType) {
        
        if (serviceType != null) {
            return serviceRepository.findByServiceTypeAndIsActiveTrue(serviceType);
        }
        
        return serviceRepository.findByIsActiveTrue();
    }

    /**
     * UC1: Get service details by ID
     */
    @GetMapping("/{id}")
    public ConsultingService getServiceById(@PathVariable Long id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
    }

    /**
     * UC2: Get availability slots for a specific service
     */
    @GetMapping("/{serviceId}/availability")
    public ResponseEntity<List<AvailabilitySlotResponse>> getAvailabilitySlotsByServiceId(@PathVariable Long serviceId) {
        // Ensure service exists
        serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        List<AvailabilitySlotResponse> slots = consultantService.getAvailabilitySlotsByServiceId(serviceId);
        return ResponseEntity.ok(slots);
    }
}
