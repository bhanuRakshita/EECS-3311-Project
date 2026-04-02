package com.consultingplatform.notification.service;

import com.consultingplatform.booking.domain.Booking;
import com.consultingplatform.notification.domain.Notification;
import com.consultingplatform.notification.domain.NotificationType;
import com.consultingplatform.notification.repository.NotificationRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void sendBookingCancelledNotifications(Booking booking) {
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
        String payload = buildBookingRejectedPayload(booking, reason);

        Notification clientNotification = Notification.builder()
                .userId(booking.getClientId())
                .notificationType(NotificationType.BOOKING_REJECTED)
                .payload(payload)
                .build();

        notificationRepository.save(clientNotification);
    }

    public void sendPaymentSuccessNotifications(Booking booking) {
        Notification clientNotification = Notification.builder()
                .userId(booking.getClientId())
                .notificationType(NotificationType.PAYMENT_SUCCESS)
                .payload("Payment successful for booking #" + booking.getId() + ". Your session is confirmed.")
                .build();

        Notification consultantNotification = Notification.builder()
                .userId(booking.getConsultantId())
                .notificationType(NotificationType.PAYMENT_SUCCESS)
                .payload("Payment received for booking #" + booking.getId() + ". The session is now fully paid.")
                .build();

        notificationRepository.save(clientNotification);
        notificationRepository.save(consultantNotification);
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
}
