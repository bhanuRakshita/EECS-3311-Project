package com.consultingplatform.admin.domain;

public class PricingStrategyConfig {
    private String strategyType; // "FIXED", "DYNAMIC"
    private double dynamicMultiplier;

    public String getStrategyType() {
        return strategyType;
    }

    public void setStrategyType(String strategyType) {
        this.strategyType = strategyType;
    }

    public double getDynamicMultiplier() {
        return dynamicMultiplier;
    }

    public void setDynamicMultiplier(double dynamicMultiplier) {
        this.dynamicMultiplier = dynamicMultiplier;
    }
}
