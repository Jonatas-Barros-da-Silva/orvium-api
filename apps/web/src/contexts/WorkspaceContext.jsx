
import React, { createContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

export const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        // For the sake of this implementation, we'll fetch the first organization
        // In a real app, this would be tied to the logged-in user's selected workspace
        const orgs = await pb.collection('organizations').getList(1, 1, { $autoCancel: false });
        if (orgs.items.length > 0) {
          setWorkspace({ id: orgs.items[0].id, ...orgs.items[0] });
        } else {
          // Fallback mock workspace if none exist
          setWorkspace({ id: 'wksp_mock_123', organization_name: 'Default Workspace' });
        }
      } catch (error) {
        console.error('Failed to fetch workspace:', error);
        setWorkspace({ id: 'wksp_mock_123', organization_name: 'Default Workspace' });
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, []);

  return (
    <WorkspaceContext.Provider value={{ workspace, loading }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
