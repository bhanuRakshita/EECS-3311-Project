package com.consultingplatform.consultant.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public class CreateAvailabilitySlotRequest {

    @NotNull(message = "serviceId is required")
    private Long serviceId;

    @NotNull(message = "startAt is required")
    private OffsetDateTime startAt;

    @NotNull(message = "endAt is required")
    private OffsetDateTime endAt;

    public Long getServiceId() { return serviceId; }
    public void setServiceId(Long serviceId) { this.serviceId = serviceId; }
    public OffsetDateTime getStartAt() { return startAt; }
    public void setStartAt(OffsetDateTime startAt) { this.startAt = startAt; }
    public OffsetDateTime getEndAt() { return endAt; }
    public void setEndAt(OffsetDateTime endAt) { this.endAt = endAt; }
}
