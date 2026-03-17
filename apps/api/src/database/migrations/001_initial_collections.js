
export async function up(pb) {
  try {
    // Check if the collection already exists
    await pb.collections.getOne('schema_migrations', { $autoCancel: false });
    console.log('   schema_migrations collection already exists.');
  } catch (error) {
    console.log('   Creating schema_migrations collection...');
    await pb.collections.create({
      name: 'schema_migrations',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      schema: [
        {
          name: 'migration_name',
          type: 'text',
          required: true,
          options: {
            min: null,
            max: null,
            pattern: ''
          }
        },
        {
          name: 'status',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: null,
            pattern: ''
          }
        },
        {
          name: 'error_message',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: null,
            pattern: ''
          }
        }
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_schema_migrations_migration_name ON schema_migrations (migration_name)'
      ]
    }, { $autoCancel: false });
  }
}
