
import { UsageEvent, UsageMeteringRecord } from './economics.types.js';

export class UsageMeteringService {
  // In a real implementation, this would interact with a database repository
  // For the SDK/Service layer, we provide the business logic and structure
  
  /**
   * Validates and prepares a usage event for recording
   */
  public recordUsageEvent(event: UsageEvent): UsageMeteringRecord {
    this.validateUsageEvent(event);
    
    // Construct the record that would be saved to the database
    const record: UsageMeteringRecord = {
      id: this.generateId(),
      integration_id: event.integrationId,
      workspace_id: event.workspaceId,
      execution_id: event.executionId,
      usage_units: event.usageUnits,
      metadata: event.metadata || {},
      created: (event.timestamp || new Date()).toISOString()
    };
    
    return record;
  }

  /**
   * Aggregates usage data for a specific workspace and integration over a period
   * Note: In production, this would execute a DB aggregation query
   */
  public getUsageSummary(records: UsageMeteringRecord[], workspaceId: string, integrationId: string, startDate?: Date, endDate?: Date): number {
    let filteredRecords = records.filter(r => 
      r.workspace_id === workspaceId && 
      r.integration_id === integrationId
    );

    if (startDate) {
      filteredRecords = filteredRecords.filter(r => new Date(r.created) >= startDate);
    }
    
    if (endDate) {
      filteredRecords = filteredRecords.filter(r => new Date(r.created) <= endDate);
    }

    return filteredRecords.reduce((total, record) => total + record.usage_units, 0);
  }

  /**
   * Calculates simple usage charges based on a flat per-unit price
   */
  public calculateUsageCharges(totalUnits: number, pricePerUnit: number): number {
    if (totalUnits < 0 || pricePerUnit < 0) {
      throw new Error('Units and price must be non-negative');
    }
    return totalUnits * pricePerUnit;
  }

  private validateUsageEvent(event: UsageEvent): void {
    if (!event.integrationId) {
      throw new Error('Integration ID is required for usage metering');
    }
    if (!event.workspaceId) {
      throw new Error('Workspace ID is required for usage metering');
    }
    if (!event.executionId) {
      throw new Error('Execution ID is required for usage metering traceability');
    }
    if (event.usageUnits === undefined || event.usageUnits < 0) {
      throw new Error('Usage units must be a non-negative number');
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
