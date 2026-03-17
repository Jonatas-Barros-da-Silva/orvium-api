
export async function up(pb) {
  console.log('Running migration: 010_execution_replay_system');

  try {
    const collection = await pb.collections.getOne('integration_executions');
    
    // Add new fields if they don't exist
    const fieldsToAdd = [
      {
        name: 'replay_of_execution_id',
        type: 'text',
        required: false
      },
      {
        name: 'replay_source',
        type: 'select',
        required: false,
        values: ['original', 'manual_debug', 'api_replay', 'test_run']
      }
    ];

    let needsUpdate = false;
    for (const field of fieldsToAdd) {
      const exists = collection.fields.find(f => f.name === field.name);
      if (!exists) {
        collection.fields.push(field);
        needsUpdate = true;
      }
    }

    // Add indexes if they don't exist
    const indexesToAdd = [
      'CREATE INDEX idx_integration_executions_replay_of ON integration_executions (replay_of_execution_id)',
      'CREATE INDEX idx_integration_executions_replay_source ON integration_executions (replay_source)'
    ];

    for (const idx of indexesToAdd) {
      if (!collection.indexes.includes(idx)) {
        collection.indexes.push(idx);
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await pb.collections.update(collection.id, collection);
      console.log('Updated integration_executions collection with replay fields and indexes');
    } else {
      console.log('integration_executions collection already has replay fields');
    }

    return true;
  } catch (error) {
    console.error('Migration 010 failed:', error);
    throw error;
  }
}
