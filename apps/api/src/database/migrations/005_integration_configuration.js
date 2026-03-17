
export async function up(pb) {
  console.log('Running migration: 005_integration_configuration');

  try {
    // 1. Create integration_configs collection
    const configsCollection = {
      name: 'integration_configs',
      type: 'base',
      listRule: '@request.auth.role = "admin" || installation_id.workspace_id = @request.auth.organization_id',
      viewRule: '@request.auth.role = "admin" || installation_id.workspace_id = @request.auth.organization_id',
      createRule: null, // Managed by API
      updateRule: null, // Managed by API
      deleteRule: null, // Managed by API
      fields: [
        {
          name: 'installation_id',
          type: 'relation',
          required: true,
          collectionId: 'pbc_9147888590', // integration_installations
          cascadeDelete: true,
          maxSelect: 1
        },
        {
          name: 'config_key',
          type: 'text',
          required: true
        },
        {
          name: 'config_value_encrypted',
          type: 'text',
          required: true
        },
        {
          name: 'is_sensitive',
          type: 'bool',
          required: false
        }
      ],
      indexes: [
        'CREATE INDEX idx_integration_configs_installation ON integration_configs (installation_id)',
        'CREATE UNIQUE INDEX idx_integration_configs_unique_key ON integration_configs (installation_id, config_key)'
      ]
    };

    // Check if collection exists, if not create it
    try {
      await pb.collections.getOne('integration_configs');
      console.log('Collection integration_configs already exists');
    } catch (e) {
      await pb.collections.create(configsCollection);
      console.log('Created integration_configs collection');
    }

    // 2. Update integration_installations status field
    try {
      const installationsCollection = await pb.collections.getOne('integration_installations');
      
      // Find the status field
      const statusField = installationsCollection.fields.find(f => f.name === 'status');
      if (statusField) {
        // Update values
        statusField.values = ['installed', 'needs_configuration', 'configured', 'error', 'active', 'disabled'];
        await pb.collections.update('integration_installations', installationsCollection);
        console.log('Updated integration_installations status field');
      }
    } catch (e) {
      console.warn('Could not update integration_installations collection:', e.message);
    }

    return true;
  } catch (error) {
    console.error('Migration 005 failed:', error);
    throw error;
  }
}
