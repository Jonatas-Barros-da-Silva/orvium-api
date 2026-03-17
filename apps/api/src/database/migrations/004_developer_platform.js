
/**
 * Migration: Developer Platform Collections
 * Creates collections for developer accounts and integration submissions.
 */
export default {
  up: async (pb) => {
    console.log('Running migration 004_developer_platform: UP');
    
    try {
      // 1. Create developer_accounts collection
      await pb.collections.create({
        name: 'developer_accounts',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: 'user_id = @request.auth.id',
        deleteRule: null,
        fields: [
          {
            name: 'user_id',
            type: 'relation',
            required: true,
            options: {
              collectionId: '_pb_users_auth_',
              cascadeDelete: true,
              maxSelect: 1
            }
          },
          {
            name: 'company_name',
            type: 'text',
            required: true
          },
          {
            name: 'website',
            type: 'url',
            required: false
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            options: {
              values: ['pending', 'approved', 'rejected', 'suspended']
            }
          }
        ]
      });

      // 2. Create integration_submissions collection
      await pb.collections.create({
        name: 'integration_submissions',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: null,
        fields: [
          {
            name: 'developer_id',
            type: 'relation',
            required: true,
            options: {
              collectionId: 'developer_accounts',
              cascadeDelete: true,
              maxSelect: 1
            }
          },
          {
            name: 'app_id',
            type: 'relation',
            required: false,
            options: {
              collectionId: 'integration_apps',
              maxSelect: 1
            }
          },
          {
            name: 'name',
            type: 'text',
            required: true
          },
          {
            name: 'description',
            type: 'text',
            required: false
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            options: {
              values: ['draft', 'in_review', 'approved', 'rejected']
            }
          }
        ]
      });
      
      console.log('Migration 004_developer_platform completed successfully.');
    } catch (error) {
      console.error('Migration 004_developer_platform failed:', error.message);
      throw error;
    }
  },
  
  down: async (pb) => {
    console.log('Running migration 004_developer_platform: DOWN');
    try {
      await pb.collections.delete('integration_submissions');
      await pb.collections.delete('developer_accounts');
      console.log('Rollback 004_developer_platform completed successfully.');
    } catch (error) {
      console.error('Rollback 004_developer_platform failed:', error.message);
    }
  }
};
