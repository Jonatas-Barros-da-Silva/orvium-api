
import { RevenueShareConfig, DeveloperRevenue } from './economics.types.js';

export class RevenueShareService {
  // Default 80/20 split in favor of the developer
  private readonly DEFAULT_CONFIG: RevenueShareConfig = {
    platformFeePercentage: 0.20,
    developerSharePercentage: 0.80
  };

  /**
   * Calculates the revenue split between platform and developer
   */
  public calculateRevenueSplit(grossAmount: number, config: RevenueShareConfig = this.DEFAULT_CONFIG): { platformFee: number; developerShare: number } {
    if (grossAmount < 0) {
      throw new Error('Gross amount cannot be negative');
    }
    
    // Ensure percentages sum to 1 (100%)
    const totalPercentage = config.platformFeePercentage + config.developerSharePercentage;
    if (Math.abs(totalPercentage - 1.0) > 0.001) {
      throw new Error('Revenue share percentages must sum to 1.0 (100%)');
    }

    // Use Math.round to handle floating point precision issues with currency
    const platformFee = Math.round((grossAmount * config.platformFeePercentage) * 100) / 100;
    const developerShare = Math.round((grossAmount * config.developerSharePercentage) * 100) / 100;

    // Ensure exact match after rounding
    const adjustment = grossAmount - (platformFee + developerShare);
    
    return {
      platformFee: platformFee + adjustment, // Add any rounding remainder to platform fee
      developerShare
    };
  }

  /**
   * Creates a developer revenue record based on a gross transaction amount
   */
  public recordDeveloperRevenue(
    developerId: string, 
    integrationId: string, 
    grossAmount: number, 
    currency: string = 'USD',
    config?: RevenueShareConfig
  ): DeveloperRevenue {
    
    if (!developerId || !integrationId) {
      throw new Error('Developer ID and Integration ID are required');
    }

    const split = this.calculateRevenueSplit(grossAmount, config);

    return {
      id: this.generateId(),
      developer_id: developerId,
      integration_id: integrationId,
      gross_revenue: grossAmount,
      platform_fee: split.platformFee,
      developer_share: split.developerShare,
      currency,
      created: new Date().toISOString()
    };
  }

  /**
   * Aggregates total earnings for a specific developer
   */
  public getDeveloperEarnings(records: DeveloperRevenue[], developerId: string): number {
    return records
      .filter(r => r.developer_id === developerId)
      .reduce((total, record) => total + record.developer_share, 0);
  }

  /**
   * Aggregates total gross revenue for a specific integration
   */
  public getIntegrationRevenue(records: DeveloperRevenue[], integrationId: string): number {
    return records
      .filter(r => r.integration_id === integrationId)
      .reduce((total, record) => total + record.gross_revenue, 0);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
