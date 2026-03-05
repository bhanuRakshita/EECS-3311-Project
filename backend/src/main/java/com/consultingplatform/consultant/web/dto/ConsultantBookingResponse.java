package com.consultingplatform.consultant.web.dto;

import java.time.OffsetDateTime;

public class ConsultantBookingResponse {

    private Long id;
    private Long clientId;
    private Long consultantId;
    private Long serviceId;
    private OffsetDateTime requestedStartAt;
    private OffsetDateTime requestedEndAt;
    private String status;
    private OffsetDateTime requestedAt;
    private OffsetDateTime consultantDecidedAt;
    private OffsetDateTime completedAt;
    private String rejectionReason;

    public ConsultantBookingResponse(Long id, Long clientId, Long consultantId, Long serviceId,
                                     OffsetDateTime requestedStartAt, OffsetDateTime requestedEndAt,
                                     String status, OffsetDateTime requestedAt,
                                     OffsetDateTime consultantDecidedAt, OffsetDateTime completedAt,
                                     String rejectionReason) {
        this.id = id;
        this.clientId = clientId;
        this.consultantId = consultantId;
        this.serviceId = serviceId;
        this.requestedStartAt = requestedStartAt;
        this.requestedEndAt = requestedEndAt;
        this.status = status;
        this.requestedAt = requestedAt;
        this.consultantDecidedAt = consultantDecidedAt;
        this.completedAt = completedAt;
        this.rejectionReason = rejectionReason;
    }

    public Long getId() { return id; }
    public Long getClientId() { return clientId; }
    public Long getConsultantId() { return consultantId; }
    public Long getServiceId() { return serviceId; }
    public OffsetDateTime getRequestedStartAt() { return requestedStartAt; }
    public OffsetDateTime getRequestedEndAt() { return requestedEndAt; }
    public String getStatus() { return status; }
    public OffsetDateTime getRequestedAt() { return requestedAt; }
    public OffsetDateTime getConsultantDecidedAt() { return consultantDecidedAt; }
    public OffsetDateTime getCompletedAt() { return completedAt; }
    public String getRejectionReason() { return rejectionReason; }
}
