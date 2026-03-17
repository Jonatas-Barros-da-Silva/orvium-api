
import { MigrationManager } from './MigrationManager.js';

export default async function migrate(pb) {
  const manager = new MigrationManager(pb);

  // 1. integration_rate_limits
  await manager.createCollection({
    id: 'pbc_gov_irl',
    name: 'integration_rate_limits',
    type: 'base',
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'integration_version_id', type: 'relation', collectionId: 'pbc_7453453272', required: true, cascadeDelete: true, maxSelect: 1 },
      { name: 'max_per_minute', type: 'number', required: false },
      { name: 'max_per_hour', type: 'number', required: false },
      { name: 'max_per_day', type: 'number', required: false },
      { name: 'max_concurrent', type: 'number', required: false }
    ],
    indexes: ['CREATE UNIQUE INDEX idx_irl_version ON integration_rate_limits (integration_version_id)']
  });

  // 2. developer_rate_limits
  await manager.createCollection({
    id: 'pbc_gov_drl',
    name: 'developer_rate_limits',
    type: 'base',
    listRule: 'developer_id = @request.auth.id',
    viewRule: 'developer_id = @request.auth.id',
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'developer_id', type: 'relation', collectionId: '_pb_users_auth_', required: true, cascadeDelete: true, maxSelect: 1 },
      { name: 'max_integrations', type: 'number', required: false },
      { name: 'max_executions_per_day', type: 'number', required: false },
      { name: 'max_executions_per_month', type: 'number', required: false }
    ],
    indexes: ['CREATE UNIQUE INDEX idx_drl_dev ON developer_rate_limits (developer_id)']
  });

  // 3. workspace_rate_limits
  await manager.createCollection({
    id: 'pbc_gov_wrl',
    name: 'workspace_rate_limits',
    type: 'base',
    listRule: 'workspace_id = @request.auth.organization_id',
    viewRule: 'workspace_id = @request.auth.organization_id',
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'workspace_id', type: 'text', required: true },
      { name: 'max_integrations', type: 'number', required: false },
      { name: 'max_executions_per_month', type: 'number', required: false },
      { name: 'max_concurrent_executions', type: 'number', required: false },
      { name: 'plan', type: 'select', values: ['free', 'pro', 'enterprise'], required: false }
    ],
    indexes: ['CREATE UNIQUE INDEX idx_wrl_ws ON workspace_rate_limits (workspace_id)']
  });

  // 4. execution_counters
  await manager.createCollection({
    id: 'pbc_gov_ec',
    name: 'execution_counters',
    type: 'base',
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'scope_type', type: 'select', values: ['integration', 'developer', 'workspace', 'platform'], required: true },
      { name: 'scope_id', type: 'text', required: true },
      { name: 'window', type: 'select', values: ['minute', 'hour', 'day', 'month'], required: true },
      { name: 'count', type: 'number', required: false },
      { name: 'window_start', type: 'date', required: true }
    ],
    indexes: [
      'CREATE INDEX idx_ec_scope_window ON execution_counters (scope_id, window)',
      'CREATE INDEX idx_ec_window_start ON execution_counters (window_start)',
      'CREATE INDEX idx_ec_scope_type ON execution_counters (scope_type)',
      'CREATE UNIQUE INDEX idx_ec_composite ON execution_counters (scope_type, scope_id, window, window_start)'
    ]
  });

  // 5. integration_abuse_flags
  await manager.createCollection({
    id: 'pbc_gov_iaf',
    name: 'integration_abuse_flags',
    type: 'base',
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'integration_version_id', type: 'relation', collectionId: 'pbc_7453453272', required: true, cascadeDelete: true, maxSelect: 1 },
      { name: 'reason', type: 'select', values: ['execution_loop', 'burst_detected', 'failure_storm', 'quota_exceeded', 'rate_limit_exceeded'], required: true },
      { name: 'blocked_until', type: 'date', required: true }
    ],
    indexes: [
      'CREATE INDEX idx_iaf_version ON integration_abuse_flags (integration_version_id)',
      'CREATE INDEX idx_iaf_reason ON integration_abuse_flags (reason)',
      'CREATE INDEX idx_iaf_blocked ON integration_abuse_flags (blocked_until)'
    ]
  });
}
