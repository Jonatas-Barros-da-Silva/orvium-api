
export class GovernanceLogger {
  constructor(db) {
    this.db = db;
  }

  async logRateLimitHit(context, reason) {
    await this._logEvent(context, 'rate_limit_hit', reason);
  }

  async logQuotaExceeded(context, reason) {
    await this._logEvent(context, 'quota_exceeded', reason);
  }

  async logAbuseDetection(context, reason) {
    await this._logEvent(context, 'abuse_detected', reason);
  }

  async _logEvent(context, eventType, reason) {
    try {
      if (!this.db || !this.db.collection) return;
      
      await this.db.collection('integration_logs').create({
        workspace_id: context.workspaceId,
        adapter_name: context.integrationId || 'unknown',
        event_type: eventType,
        status: 'failed',
        error_message: reason,
        created_at: new Date().toISOString()
      }, { $autoCancel: false });
    } catch (error) {
      console.error(`Failed to log governance event (${eventType}):`, error.message);
    }
  }
}
