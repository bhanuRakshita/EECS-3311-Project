package com.consultingplatform.notification.service;

import com.consultingplatform.admin.domain.NotificationSettingsConfig;
import com.consultingplatform.admin.service.SystemPolicyService;
import com.consultingplatform.booking.domain.Booking;
import com.consultingplatform.notification.domain.Notification;
import com.consultingplatform.notification.domain.NotificationType;
import com.consultingplatform.notification.repository.NotificationRepository;
import com.consultingplatform.user.domain.Consultant;
import com.consultingplatform.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
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

    public void sendPaymentSuccessNotification(Booking booking) {
        String payload = buildPaymentSuccessPayload(booking);

        Notification notification = Notification.builder()
                .userId(booking.getClientId())
                .notificationType(NotificationType.PAYMENT_SUCCESS)
                .payload(payload)
                .build();

        notificationRepository.save(notification);
    }

    public void sendConsultantPendingApprovalNotificationsToAdmins(Consultant consultant) {
        String payload = buildConsultantPendingApprovalPayload(consultant);
        for (Long adminId : userRepository.findAllAdminIds()) {
            Notification notification = Notification.builder()
                    .userId(adminId)
                    .notificationType(NotificationType.CONSULTANT_PENDING_APPROVAL)
                    .payload(payload)
                    .build();
            notificationRepository.save(notification);
        }
    }

    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUserId().equals(userId)) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    private String buildBookingCancelledPayload(Booking booking) {
        return "Booking #" + booking.getId() + " was cancelled.";
    }

    private String buildBookingRejectedPayload(Booking booking, String reason) {
        if (reason != null && !reason.isBlank()) {
            return "Booking #" + booking.getId() + " was rejected by the consultant. Reason: " + reason;
        }
        return "Booking #" + booking.getId() + " was rejected by the consultant.";
    }

    private String buildPaymentSuccessPayload(Booking booking) {
        return "Payment successful for booking #" + booking.getId() + ". Your session is confirmed.";
    }

    private String buildConsultantPendingApprovalPayload(Consultant consultant) {
        String name = consultant.getFullName() != null ? consultant.getFullName() : consultant.getEmail();
        return "New consultant " + name + " (ID #" + consultant.getId() + ") is registered and pending approval.";
    }
}
