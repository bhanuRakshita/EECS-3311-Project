package com.consultingplatform.payment.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_methods")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long clientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "method_type", nullable = false)
    private PaymentType type;

    // Backward-compatible mirror for legacy schema that still requires payment_methods.type.
    @Column(name = "type")
    private String legacyType;

    @Column(name = "display_label", nullable = false)
    private String displayLabel;

    private String last4Digits;
    private String expiryDate;
    private String cardholderName;
    private String paypalEmail;
    private String last4AccountDigits;
    private String routingNumber;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (isDefault == null) isDefault = false;
        syncLegacyType();
        if (displayLabel == null || displayLabel.isBlank()) {
            displayLabel = buildDisplayLabel();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        syncLegacyType();
        if (displayLabel == null || displayLabel.isBlank()) {
            displayLabel = buildDisplayLabel();
        }
    }

    private void syncLegacyType() {
        legacyType = (type != null) ? type.name() : null;
    }

    private String buildDisplayLabel() {
        if ((type == PaymentType.CREDIT_CARD || type == PaymentType.DEBIT_CARD) && last4Digits != null && !last4Digits.isBlank()) {
            return type.name() + " •••• " + last4Digits;
        }
        if (type == PaymentType.PAYPAL && paypalEmail != null && !paypalEmail.isBlank()) {
            return "PAYPAL " + paypalEmail;
        }
        if (type == PaymentType.BANK_TRANSFER && last4AccountDigits != null && !last4AccountDigits.isBlank()) {
            return "BANK_TRANSFER •••• " + last4AccountDigits;
        }
        return type != null ? type.name() : "PAYMENT_METHOD";
    }
}
