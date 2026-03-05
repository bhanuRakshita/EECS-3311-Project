package com.consultingplatform.user.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@DiscriminatorValue("CONSULTANT")
@Data
@EqualsAndHashCode(callSuper = true)
public class Consultant extends User {

    @Column(name = "rating")
    private Double rating;
    
    @Column(name = "is_approved")
    private Boolean isApproved = false;
    
    // Business logic handled by Consultant module

    @Override
    public boolean login() {
        // Consultant must be approved and active to login
        return this.getAccountStatus() != null && 
               this.getAccountStatus().equals("ACTIVE") &&
               this.isApproved != null && 
               this.isApproved;
    }

    @Override
    public void logout() {
        // Logout logic handled by security framework
    }
}
