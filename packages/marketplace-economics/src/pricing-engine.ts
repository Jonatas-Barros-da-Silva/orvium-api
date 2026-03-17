
import { PricingModel, IntegrationPricingConfig, PricingCalculation, PricingTier } from './economics.types.js';

export class PricingEngine {
  /**
   * Calculates the total price based on the configured pricing model and usage.
   */
  public calculatePrice(config: IntegrationPricingConfig, usageUnits: number = 0): PricingCalculation {
    this.validatePricingModel(config);

    switch (config.pricing_model) {
      case PricingModel.FREE:
        return this.calculateFreePrice(config);
      case PricingModel.FIXED:
        return this.calculateFixedPrice(config);
      case PricingModel.USAGE_BASED:
        return this.calculateUsageBasedPrice(config, usageUnits);
      case PricingModel.TIERED_USAGE:
        return this.calculateTieredUsagePrice(config, usageUnits);
      default:
        throw new Error(`Unsupported pricing model: ${config.pricing_model}`);
    }
  }

  /**
   * Validates that the pricing configuration has all required fields for its model.
   */
  public validatePricingModel(config: IntegrationPricingConfig): void {
    if (!config.pricing_model) {
      throw new Error('Pricing model is required');
    }

    switch (config.pricing_model) {
      case PricingModel.FIXED:
        if (config.base_price === undefined || config.base_price < 0) {
          throw new Error('Valid base_price is required for fixed pricing model');
        }
        break;
      case PricingModel.USAGE_BASED:
        if (config.usage_price === undefined || config.usage_price < 0) {
          throw new Error('Valid usage_price is required for usage-based pricing model');
        }
        break;
      case PricingModel.TIERED_USAGE:
        if (!config.tiers || !Array.isArray(config.tiers) || config.tiers.length === 0) {
          throw new Error('Tiers array is required for tiered-usage pricing model');
        }
        // Validate tier structure
        let previousUpTo = -1;
        for (const tier of config.tiers) {
          if (tier.price === undefined || tier.price < 0) {
            throw new Error('Valid price is required for all tiers');
          }
          if (tier.upTo !== null) {
            if (tier.upTo <= previousUpTo) {
              throw new Error('Tiers must be in ascending order of upTo values');
            }
            previousUpTo = tier.upTo;
          } else {
            // If upTo is null (infinity), it must be the last tier
            if (config.tiers.indexOf(tier) !== config.tiers.length - 1) {
              throw new Error('Tier with upTo=null must be the final tier');
            }
          }
        }
        break;
    }
  }

  private calculateFreePrice(config: IntegrationPricingConfig): PricingCalculation {
    return {
      totalAmount: 0,
      baseAmount: 0,
      usageAmount: 0,
      currency: config.currency || 'USD'
    };
  }

  private calculateFixedPrice(config: IntegrationPricingConfig): PricingCalculation {
    const baseAmount = config.base_price || 0;
    return {
      totalAmount: baseAmount,
      baseAmount: baseAmount,
      usageAmount: 0,
      currency: config.currency || 'USD'
    };
  }

  private calculateUsageBasedPrice(config: IntegrationPricingConfig, units: number): PricingCalculation {
    const baseAmount = config.base_price || 0;
    const usageAmount = (config.usage_price || 0) * Math.max(0, units);
    
    return {
      totalAmount: baseAmount + usageAmount,
      baseAmount: baseAmount,
      usageAmount: usageAmount,
      currency: config.currency || 'USD'
    };
  }

  private calculateTieredUsagePrice(config: IntegrationPricingConfig, units: number): PricingCalculation {
    const baseAmount = config.base_price || 0;
    let remainingUnits = Math.max(0, units);
    let usageAmount = 0;
    let previousTierLimit = 0;
    const tiersApplied: { tier: PricingTier; units: number; cost: number }[] = [];

    if (!config.tiers) {
      return { totalAmount: baseAmount, baseAmount, usageAmount: 0, currency: config.currency || 'USD' };
    }

    for (const tier of config.tiers) {
      if (remainingUnits <= 0) break;

      const tierSize = tier.upTo === null ? Infinity : tier.upTo - previousTierLimit;
      const unitsInThisTier = Math.min(remainingUnits, tierSize);
      
      if (unitsInThisTier > 0) {
        let tierCost = unitsInThisTier * tier.price;
        if (tier.flatFee) {
          tierCost += tier.flatFee;
        }
        
        usageAmount += tierCost;
        remainingUnits -= unitsInThisTier;
        
        tiersApplied.push({
          tier,
          units: unitsInThisTier,
          cost: tierCost
        });
      }

      if (tier.upTo !== null) {
        previousTierLimit = tier.upTo;
      }
    }

    return {
      totalAmount: baseAmount + usageAmount,
      baseAmount: baseAmount,
      usageAmount: usageAmount,
      currency: config.currency || 'USD',
      breakdown: { tiersApplied }
    };
  }
}
