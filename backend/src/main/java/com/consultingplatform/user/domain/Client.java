package com.consultingplatform.user.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@DiscriminatorValue("CLIENT")
@Data
@EqualsAndHashCode(callSuper = true)
public class Client extends User {

    // No client-specific fields
    // Business logic handled by Booking and Payment modules

    @Override
    public boolean login() {
        return this.getAccountStatus() != null && 
               this.getAccountStatus().equals("ACTIVE");
    }

    @Override
    public void logout() {
        // Logout logic handled by security framework
    }
}
