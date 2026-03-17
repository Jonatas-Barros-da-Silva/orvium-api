
import pb from '../utils/pocketbaseClient.js';

/**
 * Calculate usage metrics for a workspace
 */
export async function calculateMetrics(workspaceId, fromDate, toDate) {
  const logs = await pb.collection('api_request_logs').getFullList({
    filter: `workspace_id = "${workspaceId}" && created_at >= "${fromDate}" && created_at <= "${toDate}"`,
    $autoCancel: false
  });

  if (logs.length === 0) {
    return {
      total_requests: 0,
      requests_per_minute: 0,
      error_rate: 0,
      average_latency: 0,
      success_rate: 100
    };
  }

  const totalRequests = logs.length;
  const errorCount = logs.filter(log => log.status_code >= 400).length;
  const successCount = logs.filter(log => log.status_code >= 200 && log.status_code < 300).length;
  
  const totalLatency = logs.reduce((sum, log) => sum + (log.latency_ms || 0), 0);
  const averageLatency = totalLatency / totalRequests;

  const timeRangeMs = new Date(toDate) - new Date(fromDate);
  const timeRangeMinutes = timeRangeMs / (1000 * 60);
  const requestsPerMinute = totalRequests / timeRangeMinutes;

  const errorRate = (errorCount / totalRequests) * 100;
  const successRate = (successCount / totalRequests) * 100;

  return {
    total_requests: totalRequests,
    requests_per_minute: requestsPerMinute.toFixed(2),
    error_rate: errorRate.toFixed(2),
    average_latency: averageLatency.toFixed(2),
    success_rate: successRate.toFixed(2)
  };
}

/**
 * Get requests grouped by time interval
 */
export async function getRequestsByTime(workspaceId, fromDate, toDate, interval = 'hour') {
  const logs = await pb.collection('api_request_logs').getFullList({
    filter: `workspace_id = "${workspaceId}" && created_at >= "${fromDate}" && created_at <= "${toDate}"`,
    sort: 'created_at',
    $autoCancel: false
  });

  const grouped = {};
  
  logs.forEach(log => {
    const date = new Date(log.created_at);
    let key;
    
    if (interval === 'hour') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    grouped[key] = (grouped[key] || 0) + 1;
  });

  return Object.entries(grouped).map(([timestamp, count]) => ({
    timestamp,
    count
  }));
}

/**
 * Get requests grouped by endpoint
 */
export async function getRequestsByEndpoint(workspaceId, fromDate, toDate) {
  const logs = await pb.collection('api_request_logs').getFullList({
    filter: `workspace_id = "${workspaceId}" && created_at >= "${fromDate}" && created_at <= "${toDate}"`,
    $autoCancel: false
  });

  const grouped = {};
  
  logs.forEach(log => {
    const endpoint = log.endpoint || 'Unknown';
    if (!grouped[endpoint]) {
      grouped[endpoint] = {
        endpoint,
        count: 0,
        total_latency: 0,
        error_count: 0
      };
    }
    
    grouped[endpoint].count++;
    grouped[endpoint].total_latency += log.latency_ms || 0;
    if (log.status_code >= 400) {
      grouped[endpoint].error_count++;
    }
  });

  return Object.values(grouped).map(item => ({
    endpoint: item.endpoint,
    count: item.count,
    avg_latency: (item.total_latency / item.count).toFixed(2),
    error_rate: ((item.error_count / item.count) * 100).toFixed(2)
  })).sort((a, b) => b.count - a.count);
}

/**
 * Get status code distribution
 */
export async function getStatusCodeDistribution(workspaceId, fromDate, toDate) {
  const logs = await pb.collection('api_request_logs').getFullList({
    filter: `workspace_id = "${workspaceId}" && created_at >= "${fromDate}" && created_at <= "${toDate}"`,
    $autoCancel: false
  });

  const distribution = {
    success: 0,
    client_error: 0,
    server_error: 0
  };

  logs.forEach(log => {
    if (log.status_code >= 200 && log.status_code < 300) {
      distribution.success++;
    } else if (log.status_code >= 400 && log.status_code < 500) {
      distribution.client_error++;
    } else if (log.status_code >= 500) {
      distribution.server_error++;
    }
  });

  return distribution;
}

/**
 * Get latency distribution in buckets
 */
export async function getLatencyDistribution(workspaceId, fromDate, toDate) {
  const logs = await pb.collection('api_request_logs').getFullList({
    filter: `workspace_id = "${workspaceId}" && created_at >= "${fromDate}" && created_at <= "${toDate}"`,
    $autoCancel: false
  });

  const distribution = {
    '<100ms': 0,
    '100-500ms': 0,
    '500-1000ms': 0,
    '>1000ms': 0
  };

  logs.forEach(log => {
    const latency = log.latency_ms || 0;
    if (latency < 100) {
      distribution['<100ms']++;
    } else if (latency < 500) {
      distribution['100-500ms']++;
    } else if (latency < 1000) {
      distribution['500-1000ms']++;
    } else {
      distribution['>1000ms']++;
    }
  });

  return distribution;
}
