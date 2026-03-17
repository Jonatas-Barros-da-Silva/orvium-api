
import React from 'react';
import { Badge } from '@/components/ui/badge';

export function ConfigStatusBadge({ status }) {
  switch (status) {
    case 'configured':
    case 'active':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Configured</Badge>;
    case 'needs_configuration':
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">Needs Configuration</Badge>;
    case 'installed':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Installed</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
  }
}
