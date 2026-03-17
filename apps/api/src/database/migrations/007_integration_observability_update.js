
export async function up(pb) {
  console.log('Running migration: 007_integration_observability_update');

  try {
    // 1. Update integration_executions to add trace_id and error_stack
    try {
      const executionsCollection = await pb.collections.getOne('integration_executions');
      
      let needsUpdate = false;
      
      if (!executionsCollection.fields.find(f => f.name === 'trace_id')) {
        executionsCollection.fields.push({
          name: 'trace_id',
          type: 'text',
          required: false
        });
        needsUpdate = true;
      }
      
      if (!executionsCollection.fields.find(f => f.name === 'error_stack')) {
        executionsCollection.fields.push({
          name: 'error_stack',
          type: 'text',
          required: false
        });
        needsUpdate = true;
      }

      if (needsUpdate) {
        await pb.collections.update('integration_executions', executionsCollection);
        console.log('Updated integration_executions collection');
      }
    } catch (e) {
      console.warn('Could not update integration_executions collection:', e.message);
    }

    // 2. Create integration_logs collection
    const logsCollection = {
      name: 'integration_logs',
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
          name: 'trace_id',
          type: 'text',
          required: false
        },
        {
          name: 'integration_id',
          type: 'relation',
          required: true,
          collectionId: 'pbc_8238442555', // integration_apps
          cascadeDelete: true,
          maxSelect: 1
        },
        {
          name: 'version_id',
          type: 'relation',
          required: false,
          collectionId: 'pbc_9023119702', // integration_app_versions
          cascadeDelete: true,
          maxSelect: 1
        },
        {
          name: 'capability',
          type: 'text',
          required: false
        },
        {
          name: 'action',
          type: 'text',
          required: false
        },
        {
          name: 'log_level',
          type: 'select',
          required: true,
          values: ['debug', 'info', 'warning', 'error']
        },
        {
          name: 'message',
          type: 'text',
          required: true
        },
        {
          name: 'metadata_json',
          type: 'text',
          required: false
        },
        {
          name: 'timestamp',
          type: 'date',
          required: true
        }
      ],
      indexes: [
        'CREATE INDEX idx_integration_logs_execution_id ON integration_logs (execution_id)',
        'CREATE INDEX idx_integration_logs_trace_id ON integration_logs (trace_id)',
        'CREATE INDEX idx_integration_logs_integration_id ON integration_logs (integration_id)',
        'CREATE INDEX idx_integration_logs_log_level ON integration_logs (log_level)',
        'CREATE INDEX idx_integration_logs_timestamp ON integration_logs (timestamp)',
        'CREATE INDEX idx_integration_logs_execution_level ON integration_logs (execution_id, log_level)',
        'CREATE INDEX idx_integration_logs_integration_timestamp ON integration_logs (integration_id, timestamp)'
      ]
    };

    try {
      await pb.collections.getOne('integration_logs');
      console.log('Collection integration_logs already exists');
    } catch (e) {
      await pb.collections.create(logsCollection);
      console.log('Created integration_logs collection');
    }

    return true;
  } catch (error) {
    console.error('Migration 007 failed:', error);
    throw error;
  }
}
