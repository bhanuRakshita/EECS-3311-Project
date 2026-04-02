package com.consultingplatform.notification.service;

import com.consultingplatform.admin.domain.NotificationSettingsConfig;
import com.consultingplatform.admin.service.SystemPolicyService;
import com.consultingplatform.booking.domain.Booking;
import com.consultingplatform.notification.domain.Notification;
import com.consultingplatform.notification.domain.NotificationType;
import com.consultingplatform.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SystemPolicyService systemPolicyService;

    private boolean isNotificationSystemEnabled() {
        return systemPolicyService.getPolicyConfig("NOTIFICATION_SETTINGS", NotificationSettingsConfig.class)
                .map(NotificationSettingsConfig::isEnabled)
                .orElse(true); // Default to ON if no policy is set
    }

    public void sendBookingCancelledNotifications(Booking booking) {
        if (!isNotificationSystemEnabled()) {
            return;
        }

        String payload = buildBookingCancelledPayload(booking);

        Notification clientNotification = Notification.builder()
                .userId(booking.getClientId())
                .notificationType(NotificationType.BOOKING_CANCELLED)
                .payload(payload)
                .build();

        Notification consultantNotification = Notification.builder()
                .userId(booking.getConsultantId())
                .notificationType(NotificationType.BOOKING_CANCELLED)
                .payload(payload)
                .build();

        notificationRepository.save(clientNotification);
        notificationRepository.save(consultantNotification);
    }

    public void sendBookingRejectedNotificationToClient(Booking booking, String reason) {
        if (!isNotificationSystemEnabled()) {
            return;
        }

        String payload = buildBookingRejectedPayload(booking, reason);

        Notification clientNotification = Notification.builder()
                .userId(booking.getClientId())
                .notificationType(NotificationType.BOOKING_REJECTED)
                .payload(payload)
                .build();

        notificationRepository.save(clientNotification);
    }

    private String buildBookingCancelledPayload(Booking booking) {
        return "Booking " + booking.getId() + " was cancelled. Status: " + booking.getStatus();
    }

    private String buildBookingRejectedPayload(Booking booking, String reason) {
        if (reason != null && !reason.isBlank()) {
            return "Booking " + booking.getId() + " was rejected by consultant. Reason: " + reason;
        }
        return "Booking " + booking.getId() + " was rejected by consultant.";
    }
}
