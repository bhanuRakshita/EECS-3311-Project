package com.consultingplatform.consultant.web.dto;

import java.time.OffsetDateTime;

public class AvailabilitySlotResponse {

    private Long id;
    private Long consultantId;
    private OffsetDateTime startAt;
    private OffsetDateTime endAt;
    private Boolean isAvailable;
    private OffsetDateTime createdAt;

    public AvailabilitySlotResponse(Long id, Long consultantId, OffsetDateTime startAt,
                                    OffsetDateTime endAt, Boolean isAvailable, OffsetDateTime createdAt) {
        this.id = id;
        this.consultantId = consultantId;
        this.startAt = startAt;
        this.endAt = endAt;
        this.isAvailable = isAvailable;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getConsultantId() { return consultantId; }
    public OffsetDateTime getStartAt() { return startAt; }
    public OffsetDateTime getEndAt() { return endAt; }
    public Boolean getIsAvailable() { return isAvailable; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
