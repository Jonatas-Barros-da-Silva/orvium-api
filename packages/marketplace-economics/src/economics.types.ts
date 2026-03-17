
export enum PricingModel {
  FREE = 'free',
  FIXED = 'fixed',
  USAGE_BASED = 'usage-based',
  TIERED_USAGE = 'tiered-usage'
}

export interface PricingTier {
  upTo: number | null; // null means infinity/unlimited
  price: number;
  flatFee?: number;
}

export interface IntegrationPricingConfig {
  id?: string;
  integration_version_id: string;
  pricing_model: PricingModel;
  base_price?: number;
  usage_price?: number;
  tiers?: PricingTier[];
  currency?: string;
}

export interface PricingCalculation {
  totalAmount: number;
  baseAmount: number;
  usageAmount: number;
  currency: string;
  breakdown?: {
    tiersApplied?: { tier: PricingTier; units: number; cost: number }[];
  };
}

export interface UsageEvent {
  integrationId: string;
  workspaceId: string;
  executionId: string;
  usageUnits: number;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface UsageMeteringRecord {
  id: string;
  integration_id: string;
  workspace_id: string;
  execution_id: string;
  usage_units: number;
  metadata?: Record<string, any>;
  created: string;
}

export enum BillingEventType {
  USAGE_CHARGE = 'usage_charge',
  SUBSCRIPTION_CHARGE = 'subscription_charge',
  REFUND = 'refund'
}

export interface BillingEvent {
  id?: string;
  event_type: BillingEventType;
  integration_id: string;
  workspace_id: string;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  created?: string;
}

export interface RevenueShareConfig {
  platformFeePercentage: number;
  developerSharePercentage: number;
}

export interface DeveloperRevenue {
  id?: string;
  developer_id: string;
  integration_id: string;
  gross_revenue: number;
  platform_fee: number;
  developer_share: number;
  currency: string;
  created?: string;
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export interface MarketplaceTransaction {
  id?: string;
  workspace_id: string;
  integration_id: string;
  developer_id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  metadata?: Record<string, any>;
  created?: string;
}
