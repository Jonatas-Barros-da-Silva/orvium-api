
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchEventTypes } from '@/services/automationService.js';

const EventSelector = ({ selectedEvent, onEventChange }) => {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEventTypes();
  }, []);

  const loadEventTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEventTypes();
      setEventTypes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedEventData = eventTypes.find(e => e.event_name === selectedEvent);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Label>Event Type</Label>
        <div className="text-sm text-destructive">Failed to load event types: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="event-selector" className="text-sm font-medium">Event Type</Label>
      <Select value={selectedEvent} onValueChange={onEventChange}>
        <SelectTrigger id="event-selector" className="w-full">
          <SelectValue placeholder="Select an event type" />
        </SelectTrigger>
        <SelectContent>
          {eventTypes.map((event) => (
            <SelectItem key={event.event_name} value={event.event_name}>
              {event.event_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedEventData && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {selectedEventData.description}
        </p>
      )}
    </div>
  );
};

export default EventSelector;
