package com.consultingplatform.user.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@DiscriminatorValue("ADMIN")
@Data
@EqualsAndHashCode(callSuper = true)
public class Admin extends User {

    @Column(name = "permissions", columnDefinition = "TEXT")
    private String permissions; // JSON or comma-separated list
    
    // Business logic handled by Admin module

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
