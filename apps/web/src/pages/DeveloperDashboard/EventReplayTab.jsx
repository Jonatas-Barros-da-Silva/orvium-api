
import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Loader2, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog.jsx';
import { useToast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { formatDate } from '@/utils/apiKeyUtils.js';

export default function EventReplayTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replayEventData, setReplayEventData] = useState(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await apiServerClient.fetch('/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      // Handle both { events: [...] } and [...] response formats
      setEvents(data.events || (Array.isArray(data) ? data : []));
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleReplay = async () => {
    if (!replayEventData) return;
    
    setIsReplaying(true);
    try {
      const response = await apiServerClient.fetch(`/events/${replayEventData.event_id || replayEventData.id}/replay`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || errorData.error || 'Failed to replay event');
      }

      const data = await response.json();
      toast({
        title: 'Event Replayed',
        description: `Successfully triggered ${data.deliveries_triggered || 0} webhook deliveries.`,
      });
    } catch (error) {
      toast({
        title: 'Replay Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsReplaying(false);
      setReplayEventData(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Event Replay</h2>
          <p className="text-sm text-slate-600 mt-1">Replay historical events to all active webhook subscriptions</p>
        </div>
        <Button variant="outline" onClick={fetchEvents}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Events
          </CardTitle>
          <CardDescription>Select an event to replay it across your configured endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Event ID</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Subscriptions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">Loading events...</TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      No events found in the recent history.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id || event.event_id}>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {event.event_id || event.id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50">
                          {event.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {formatDate(event.created_at || event.created)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {event.subscriptions_count !== undefined ? event.subscriptions_count : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-primary/80 hover:bg-primary/10"
                          onClick={() => setReplayEventData(event)}
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Replay
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!replayEventData} onOpenChange={(open) => !open && !isReplaying && setReplayEventData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replay this event to all subscriptions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create new webhook delivery attempts for all active subscriptions listening to the <strong>{replayEventData?.event_type}</strong> event.
              <br /><br />
              Event ID: <span className="font-mono text-xs bg-slate-100 p-1 rounded">{replayEventData?.event_id || replayEventData?.id}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReplaying}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleReplay(); }} disabled={isReplaying}>
              {isReplaying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
              Replay Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
