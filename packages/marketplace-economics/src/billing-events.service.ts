
import { BillingEvent, BillingEventType } from './economics.types.js';

export class BillingEventsService {
  
  /**
   * Creates a validated billing event ready for persistence
   */
  public emitBillingEvent(eventData: Omit<BillingEvent, 'id' | 'created'>): BillingEvent {
    this.validateBillingEvent(eventData);
    
    return {
      ...eventData,
      id: this.generateId(),
      created: new Date().toISOString()
    };
  }

  /**
   * Filters billing events for a specific workspace within a date range
   */
  public getBillingEvents(events: BillingEvent[], workspaceId: string, startDate?: Date, endDate?: Date): BillingEvent[] {
    let filtered = events.filter(e => e.workspace_id === workspaceId);
    
    if (startDate) {
      filtered = filtered.filter(e => e.created && new Date(e.created) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(e => e.created && new Date(e.created) <= endDate);
    }
    
    return filtered;
  }

  /**
   * Calculates total billing amount and provides a breakdown by event type
   */
  public calculateBillingTotal(events: BillingEvent[]): { total: number; breakdown: Record<BillingEventType, number> } {
    const breakdown: Record<BillingEventType, number> = {
      [BillingEventType.USAGE_CHARGE]: 0,
      [BillingEventType.SUBSCRIPTION_CHARGE]: 0,
      [BillingEventType.REFUND]: 0
    };
    
    let total = 0;

    for (const event of events) {
      if (event.event_type === BillingEventType.REFUND) {
        total -= event.amount;
        breakdown[BillingEventType.REFUND] += event.amount;
      } else {
        total += event.amount;
        if (event.event_type === BillingEventType.USAGE_CHARGE) {
          breakdown[BillingEventType.USAGE_CHARGE] += event.amount;
        } else if (event.event_type === BillingEventType.SUBSCRIPTION_CHARGE) {
          breakdown[BillingEventType.SUBSCRIPTION_CHARGE] += event.amount;
        }
      }
    }

    return { total, breakdown };
  }

  private validateBillingEvent(event: Partial<BillingEvent>): void {
    if (!event.event_type || !Object.values(BillingEventType).includes(event.event_type)) {
      throw new Error('Valid billing event type is required');
    }
    if (!event.integration_id) {
      throw new Error('Integration ID is required');
    }
    if (!event.workspace_id) {
      throw new Error('Workspace ID is required');
    }
    if (event.amount === undefined || event.amount < 0) {
      throw new Error('Amount must be a non-negative number');
    }
    if (!event.currency) {
      throw new Error('Currency code is required');
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
