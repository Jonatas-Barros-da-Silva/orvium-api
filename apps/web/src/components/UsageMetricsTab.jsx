
import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { formatNumber, formatLatency, formatDate } from '@/utils/apiKeyUtils.js';

const COLORS = ['#2563EB', '#F59E0B', '#DC2626', '#16A34A', '#8B5CF6'];

export default function UsageMetricsTab() {
  const [timePeriod, setTimePeriod] = useState('24h');
  const [metrics, setMetrics] = useState(null);
  const [rateLimit, setRateLimit] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMetrics();
  }, [timePeriod]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await apiServerClient.fetch(`/developer/metrics?time_period=${timePeriod}`);
      
      // Extract Rate Limit Headers
      const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '5000', 10);
      const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '5000', 10);
      const reset = response.headers.get('X-RateLimit-Reset');
      
      if (limit && !isNaN(remaining)) {
        setRateLimit({ limit, remaining, reset });
      }

      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading metrics...</div>
      </div>
    );
  }

  const statusCodeData = metrics?.status_code_distribution ? [
    { name: '2xx Success', value: metrics.status_code_distribution.success, color: '#16A34A' },
    { name: '4xx Client Error', value: metrics.status_code_distribution.client_error, color: '#F59E0B' },
    { name: '5xx Server Error', value: metrics.status_code_distribution.server_error, color: '#DC2626' }
  ].filter(item => item.value > 0) : [];

  const latencyData = metrics?.latency_distribution ? Object.entries(metrics.latency_distribution).map(([bucket, count]) => ({
    bucket,
    count
  })) : [];

  // Rate Limit Calculations
  const percentRemaining = rateLimit ? (rateLimit.remaining / rateLimit.limit) * 100 : 100;
  let progressColorClass = 'bg-green-500';
  if (percentRemaining < 20) progressColorClass = 'bg-red-500';
  else if (percentRemaining < 50) progressColorClass = 'bg-yellow-500';

  const isRateLimitWarning = percentRemaining < 20;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Usage Metrics</h2>
          <p className="text-sm text-slate-600 mt-1">Monitor your API usage and performance</p>
        </div>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rate Limit Warning Banner */}
      {isRateLimitWarning && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 font-semibold">Rate Limit Warning</AlertTitle>
          <AlertDescription className="text-red-700 mt-1">
            You have less than 20% of your API request quota remaining for this hour. 
            Please ensure your application implements proper retry logic and respects the <code className="bg-red-100 px-1 rounded">Retry-After</code> header. 
            <a href="#docs" onClick={(e) => { e.preventDefault(); document.querySelector('[value="docs"]').click(); }} className="underline font-medium ml-1">View Documentation</a>.
          </AlertDescription>
        </Alert>
      )}

      {/* Rate Limit Status Card */}
      {rateLimit && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h3 className="text-sm font-medium text-slate-600 uppercase tracking-wider">Current Rate Limit Status</h3>
                    <div className="text-2xl font-bold text-slate-900 mt-1">
                      {formatNumber(rateLimit.remaining)} <span className="text-base font-normal text-slate-500">/ {formatNumber(rateLimit.limit)} remaining</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900">{percentRemaining.toFixed(1)}%</div>
                  </div>
                </div>
                
                {/* Custom Progress Bar for exact color control */}
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ease-in-out ${progressColorClass}`}
                    style={{ width: `${Math.max(0, Math.min(100, percentRemaining))}%` }}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-3 md:border-l md:border-slate-200 md:pl-6 min-w-[200px]">
                <div>
                  <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Requests Until Limit
                  </div>
                  <div className="text-lg font-semibold text-slate-900">{formatNumber(rateLimit.remaining)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Resets At
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {rateLimit.reset ? formatDate(rateLimit.reset) : 'Next Hour'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono-num text-slate-900">
              {formatNumber(metrics?.total_requests || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Requests/Min</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono-num text-slate-900">
              {parseFloat(metrics?.requests_per_minute || 0).toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono-num text-red-600">
              {parseFloat(metrics?.error_rate || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono-num text-slate-900">
              {formatLatency(parseFloat(metrics?.average_latency || 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono-num text-green-600">
              {parseFloat(metrics?.success_rate || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Requests Over Time</CardTitle>
            <CardDescription>Request volume by {timePeriod === '24h' ? 'hour' : 'day'}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics?.requests_by_time || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={{ fill: '#2563EB' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle>Top Endpoints</CardTitle>
            <CardDescription>Most requested endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics?.requests_by_endpoint || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="endpoint" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Code Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Code Distribution</CardTitle>
            <CardDescription>Response status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusCodeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusCodeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Latency Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Latency Distribution</CardTitle>
            <CardDescription>Response time breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Endpoints Table */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Performance</CardTitle>
          <CardDescription>Detailed endpoint statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Avg Latency</TableHead>
                <TableHead className="text-right">Error Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics?.top_endpoints?.length > 0 ? (
                metrics.top_endpoints.map((endpoint, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{endpoint.endpoint}</TableCell>
                    <TableCell className="text-right font-mono-num">{formatNumber(endpoint.count)}</TableCell>
                    <TableCell className="text-right font-mono-num">{formatLatency(parseFloat(endpoint.avg_latency))}</TableCell>
                    <TableCell className="text-right font-mono-num">
                      <span className={parseFloat(endpoint.error_rate) > 5 ? 'text-red-600' : 'text-slate-900'}>
                        {parseFloat(endpoint.error_rate).toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    No endpoint data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
