
import { MarketplaceTransaction, TransactionStatus } from './economics.types.js';

export class MarketplaceTransactionService {
  
  /**
   * Creates a new pending marketplace transaction
   */
  public createTransaction(data: Omit<MarketplaceTransaction, 'id' | 'created' | 'status'>): MarketplaceTransaction {
    this.validateTransactionData(data);
    
    return {
      ...data,
      id: this.generateId(),
      status: TransactionStatus.PENDING,
      created: new Date().toISOString()
    };
  }

  /**
   * Updates the status of an existing transaction
   */
  public updateTransactionStatus(transaction: MarketplaceTransaction, newStatus: TransactionStatus): MarketplaceTransaction {
    // Basic state machine validation
    if (transaction.status === TransactionStatus.COMPLETED && newStatus === TransactionStatus.PENDING) {
      throw new Error('Cannot move completed transaction back to pending');
    }
    if (transaction.status === TransactionStatus.REFUNDED) {
      throw new Error('Cannot change status of a refunded transaction');
    }

    return {
      ...transaction,
      status: newStatus
    };
  }

  /**
   * Filters transactions for a specific workspace (buyer)
   */
  public getWorkspaceTransactions(transactions: MarketplaceTransaction[], workspaceId: string): MarketplaceTransaction[] {
    return transactions.filter(t => t.workspace_id === workspaceId);
  }

  /**
   * Filters transactions for a specific developer (seller)
   */
  public getDeveloperTransactions(transactions: MarketplaceTransaction[], developerId: string): MarketplaceTransaction[] {
    return transactions.filter(t => t.developer_id === developerId);
  }

  /**
   * Calculates total transaction volume (only completed transactions)
   */
  public calculateTransactionVolume(transactions: MarketplaceTransaction[], integrationId?: string): number {
    let completedTxs = transactions.filter(t => t.status === TransactionStatus.COMPLETED);
    
    if (integrationId) {
      completedTxs = completedTxs.filter(t => t.integration_id === integrationId);
    }
    
    return completedTxs.reduce((total, tx) => total + tx.amount, 0);
  }

  private validateTransactionData(data: Partial<MarketplaceTransaction>): void {
    if (!data.workspace_id) throw new Error('Workspace ID is required');
    if (!data.integration_id) throw new Error('Integration ID is required');
    if (!data.developer_id) throw new Error('Developer ID is required');
    if (data.amount === undefined || data.amount < 0) throw new Error('Valid amount is required');
    if (!data.currency) throw new Error('Currency is required');
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
