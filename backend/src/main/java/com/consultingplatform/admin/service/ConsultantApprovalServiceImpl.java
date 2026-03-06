package com.consultingplatform.admin.service;

import com.consultingplatform.admin.domain.ConsultantApprovalStatus;
import com.consultingplatform.admin.domain.ConsultantRegistration;
import com.consultingplatform.admin.repository.ConsultantRegistrationRepository;
import com.consultingplatform.admin.web.dto.ConsultantApprovalDecision;
import com.consultingplatform.admin.web.dto.ConsultantApprovalRequestDto;
import com.consultingplatform.admin.web.dto.ConsultantApprovalResponseDto;
import com.consultingplatform.user.domain.Admin;
import com.consultingplatform.user.domain.User;
import com.consultingplatform.user.repository.UserRepository;
import java.time.Instant;
import org.springframework.stereotype.Service;

@Service
public class ConsultantApprovalServiceImpl implements ConsultantApprovalService {

    private final ConsultantRegistrationRepository repository;
    private final UserRepository userRepository;

    public ConsultantApprovalServiceImpl(ConsultantRegistrationRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Override
    public ConsultantApprovalResponseDto approveOrRejectConsultant(Long consultantId, ConsultantApprovalRequestDto request) {
        if (request == null || request.getDecision() == null) {
            throw new IllegalArgumentException("decision is required");
        }

        Long adminUserId;
        try {
            adminUserId = Long.parseLong(request.getAdminId());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("adminId must be a valid numeric user id");
        }

        User adminUser = userRepository.findById(adminUserId)
            .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        if (!(adminUser instanceof Admin)) {
            throw new IllegalStateException("Only admin users can approve or reject consultant registrations");
        }

        ConsultantRegistration registration = repository.findByConsultantId(consultantId)
            .orElseThrow(() -> new ResourceNotFoundException("Consultant registration not found"));

        ConsultantApprovalStatus newStatus = request.getDecision() == ConsultantApprovalDecision.APPROVE
            ? ConsultantApprovalStatus.APPROVED
            : ConsultantApprovalStatus.REJECTED;

        registration.setStatus(newStatus);
        registration.setApprovedByAdminId(request.getAdminId());
        registration.setDecisionReason(request.getReason());
        registration.setDecidedAt(Instant.now());

        ConsultantRegistration saved = repository.save(registration);

        return new ConsultantApprovalResponseDto(
            saved.getConsultantId(),
            saved.getStatus(),
            saved.getApprovedByAdminId(),
            saved.getDecidedAt()
        );
    }
}
