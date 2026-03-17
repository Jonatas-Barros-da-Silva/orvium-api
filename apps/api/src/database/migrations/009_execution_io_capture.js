
export async function up(pb) {
  console.log('Running migration: 009_execution_io_capture');

  try {
    const collection = {
      name: 'integration_execution_io',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
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
          required: true,
          collectionId: 'pbc_9023119702', // integration_app_versions
          cascadeDelete: true,
          maxSelect: 1
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
          name: 'input_payload_json',
          type: 'text',
          required: false
        },
        {
          name: 'context_json',
          type: 'text',
          required: false
        },
        {
          name: 'output_payload_json',
          type: 'text',
          required: false
        },
        {
          name: 'error_payload_json',
          type: 'text',
          required: false
        },
        {
          name: 'payload_size_bytes',
          type: 'number',
          required: false
        },
        {
          name: 'input_truncated',
          type: 'bool',
          required: false
        },
        {
          name: 'output_truncated',
          type: 'bool',
          required: false
        },
        {
          name: 'error_truncated',
          type: 'bool',
          required: false
        }
      ],
      indexes: [
        'CREATE INDEX idx_integration_execution_io_execution_id ON integration_execution_io (execution_id)',
        'CREATE INDEX idx_integration_execution_io_trace_id ON integration_execution_io (trace_id)',
        'CREATE INDEX idx_integration_execution_io_integration_id ON integration_execution_io (integration_id)',
        'CREATE INDEX idx_integration_execution_io_created_at ON integration_execution_io (created_at)',
        'CREATE INDEX idx_integration_execution_io_execution_integration ON integration_execution_io (execution_id, integration_id)'
      ]
    };

    try {
      await pb.collections.getOne('integration_execution_io');
      console.log('Collection integration_execution_io already exists');
    } catch (e) {
      await pb.collections.create(collection);
      console.log('Created integration_execution_io collection');
    }

    return true;
  } catch (error) {
    console.error('Migration 009 failed:', error);
    throw error;
  }
}
