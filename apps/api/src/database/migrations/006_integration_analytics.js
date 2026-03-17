
export async function up(pb) {
  console.log('Running migration: 006_integration_analytics');

  try {
    const collection = {
      name: 'integration_executions',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: null, // Managed by API/Workers
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'execution_id',
          type: 'text',
          required: true
        },
        {
          name: 'integration_id',
          type: 'text',
          required: true
        },
        {
          name: 'version_id',
          type: 'text',
          required: true
        },
        {
          name: 'capability',
          type: 'text',
          required: true
        },
        {
          name: 'action',
          type: 'text',
          required: true
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['success', 'failure', 'timeout', 'error']
        },
        {
          name: 'latency_ms',
          type: 'number',
          required: true
        },
        {
          name: 'trigger_type',
          type: 'select',
          required: true,
          values: ['automation', 'manual', 'webhook', 'scheduled']
        },
        {
          name: 'worker_id',
          type: 'text',
          required: false
        },
        {
          name: 'error_code',
          type: 'text',
          required: false
        },
        {
          name: 'error_type',
          type: 'select',
          required: false,
          values: ['validation_error', 'authentication_error', 'network_error', 'timeout_error', 'runtime_error', 'unknown_error']
        },
        {
          name: 'error_message',
          type: 'text',
          required: false
        },
        {
          name: 'started_at',
          type: 'date',
          required: true
        },
        {
          name: 'finished_at',
          type: 'date',
          required: true
        }
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_integration_executions_id ON integration_executions (execution_id)',
        'CREATE INDEX idx_integration_executions_integration ON integration_executions (integration_id)',
        'CREATE INDEX idx_integration_executions_version ON integration_executions (version_id)',
        'CREATE INDEX idx_integration_executions_status ON integration_executions (status)',
        'CREATE INDEX idx_integration_executions_created ON integration_executions (created)',
        'CREATE INDEX idx_integration_executions_latency ON integration_executions (latency_ms)',
        'CREATE INDEX idx_integration_executions_error_type ON integration_executions (error_type)',
        'CREATE INDEX idx_integration_executions_trigger ON integration_executions (trigger_type)',
        'CREATE INDEX idx_integration_executions_comp_status ON integration_executions (integration_id, status)',
        'CREATE INDEX idx_integration_executions_comp_created ON integration_executions (integration_id, created)'
      ]
    };

    try {
      await pb.collections.getOne('integration_executions');
      console.log('Collection integration_executions already exists');
    } catch (e) {
      await pb.collections.create(collection);
      console.log('Created integration_executions collection');
    }

    return true;
  } catch (error) {
    console.error('Migration 006 failed:', error);
    throw error;
  }
}
