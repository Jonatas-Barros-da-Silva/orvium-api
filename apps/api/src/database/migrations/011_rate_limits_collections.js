export async function up(pb) {
  console.log('Running migration: 011_rate_limits_collections');

  try {
    // 1. Create integration_rate_limits collection
    const integrationRateLimitsCollection = {
      name: 'integration_rate_limits',
      type: 'base',
      listRule: '@request.auth.role = "admin" || integration_version_id.integration_app_id.workspace_id = @request.auth.organization_id',
      viewRule: '@request.auth.role = "admin" || integration_version_id.integration_app_id.workspace_id = @request.auth.organization_id',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'integration_version_id',
          type: 'relation',
          required: true,
          collectionId: 'pbc_9023119702', // integration_versions
          cascadeDelete: true,
          maxSelect: 1
        },
        {
          name: 'max_per_minute',
          type: 'number',
          required: false,
          min: 1,
          max: null
        },
        {
          name: 'max_per_hour',
          type: 'number',
          required: false,
          min: 1,
          max: null
        },
        {
          name: 'max_per_day',
          type: 'number',
          required: false,
          min: 1,
          max: null
        },
        {
          name: 'max_concurrent',
          type: 'number',
          required: false,
          min: 1,
          max: null
        }
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_integration_rate_limits_version ON integration_rate_limits (integration_version_id)'
      ]
    };

    try {
      await pb.collections.getOne('integration_rate_limits');
      console.log('   ✅ Verified collection exists: integration_rate_limits');
    } catch (e) {
      await pb.collections.create(integrationRateLimitsCollection);
      console.log('   ✅ Created collection: integration_rate_limits');
    }

    // 2. Create developer_rate_limits collection
    const developerRateLimitsCollection = {
      name: 'developer_rate_limits',
      type: 'base',
      listRule: '@request.auth.role = "admin" || developer_id = @request.auth.id',
      viewRule: '@request.auth.role = "admin" || developer_id = @request.auth.id',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'developer_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1
        },
        {
          name: 'max_integrations',
          type: 'number',
          required: false,
          min: 1,
          max: null
        },
        {
          name: 'max_executions_per_day',
          type: 'number',
          required: false,
          min: 1,
          max: null
        },
        {
          name: 'max_executions_per_month',
          type: 'number',
          required: false,
          min: 1,
          max: null
        }
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_developer_rate_limits_developer ON developer_rate_limits (developer_id)'
      ]
    };

    try {
      await pb.collections.getOne('developer_rate_limits');
      console.log('   ✅ Verified collection exists: developer_rate_limits');
    } catch (e) {
      await pb.collections.create(developerRateLimitsCollection);
      console.log('   ✅ Created collection: developer_rate_limits');
    }

    // 3. Create workspace_rate_limits collection
    const workspaceRateLimitsCollection = {
      name: 'workspace_rate_limits',
      type: 'base',
      listRule: '@request.auth.role = "admin" || workspace_id = @request.auth.organization_id',
      viewRule: '@request.auth.role = "admin" || workspace_id = @request.auth.organization_id',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'workspace_id',
          type: 'text',
          required: true
        },
        {
          name: 'max_integrations',
          type: 'number',
          required: false,
          min: 1,
          max: null
        },
        {
          name: 'max_executions_per_month',
          type: 'number',
          required: false,
          min: 1,
          max: null
        },
        {
          name: 'max_concurrent_executions',
          type: 'number',
          required: false,
          min: 1,
          max: null
        },
        {
          name: 'plan',
          type: 'select',
          required: false,
          values: ['free', 'pro', 'enterprise']
        }
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_workspace_rate_limits_workspace ON workspace_rate_limits (workspace_id)'
      ]
    };

    try {
      await pb.collections.getOne('workspace_rate_limits');
      console.log('   ✅ Verified collection exists: workspace_rate_limits');
    } catch (e) {
      await pb.collections.create(workspaceRateLimitsCollection);
      console.log('   ✅ Created collection: workspace_rate_limits');
    }

    // 4. Create execution_counters collection
    const executionCountersCollection = {
      name: 'execution_counters',
      type: 'base',
      listRule: '@request.auth.role = "admin"',
      viewRule: '@request.auth.role = "admin"',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'scope_type',
          type: 'select',
          required: true,
          values: ['integration', 'developer', 'workspace', 'platform']
        },
        {
          name: 'scope_id',
          type: 'text',
          required: true
        },
        {
          name: 'window',
          type: 'select',
          required: true,
          values: ['minute', 'hour', 'day', 'month']
        },
        {
          name: 'count',
          type: 'number',
          required: false,
          min: 0,
          max: null
        },
        {
          name: 'window_start',
          type: 'date',
          required: true
        }
      ],
      indexes: [
        'CREATE INDEX idx_execution_counters_scope_window ON execution_counters (scope_id, window)',
        'CREATE INDEX idx_execution_counters_window_start ON execution_counters (window_start)',
        'CREATE INDEX idx_execution_counters_scope_type ON execution_counters (scope_type)',
        'CREATE INDEX idx_execution_counters_composite ON execution_counters (scope_type, scope_id, window)'
      ]
    };

    try {
      await pb.collections.getOne('execution_counters');
      console.log('   ✅ Verified collection exists: execution_counters');
    } catch (e) {
      await pb.collections.create(executionCountersCollection);
      console.log('   ✅ Created collection: execution_counters');
    }

    // 5. Create integration_abuse_flags collection
    const integrationAbuseFlagsCollection = {
      name: 'integration_abuse_flags',
      type: 'base',
      listRule: '@request.auth.role = "admin"',
      viewRule: '@request.auth.role = "admin"',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'integration_version_id',
          type: 'relation',
          required: true,
          collectionId: 'pbc_9023119702', // integration_versions
          cascadeDelete: true,
          maxSelect: 1
        },
        {
          name: 'reason',
          type: 'select',
          required: true,
          values: ['execution_loop', 'burst_detected', 'failure_storm', 'quota_exceeded', 'rate_limit_exceeded']
        },
        {
          name: 'blocked_until',
          type: 'date',
          required: true
        }
      ],
      indexes: [
        'CREATE INDEX idx_integration_abuse_flags_version ON integration_abuse_flags (integration_version_id)',
        'CREATE INDEX idx_integration_abuse_flags_reason ON integration_abuse_flags (reason)',
        'CREATE INDEX idx_integration_abuse_flags_blocked_until ON integration_abuse_flags (blocked_until)'
      ]
    };

    try {
      await pb.collections.getOne('integration_abuse_flags');
      console.log('   ✅ Verified collection exists: integration_abuse_flags');
    } catch (e) {
      await pb.collections.create(integrationAbuseFlagsCollection);
      console.log('   ✅ Created collection: integration_abuse_flags');
    }

    console.log('\n✅ Migration 011_rate_limits_collections completed successfully.');
    return true;
  } catch (error) {
    console.error('❌ Migration 011 failed:', error.message);
    throw error;
  }
}
