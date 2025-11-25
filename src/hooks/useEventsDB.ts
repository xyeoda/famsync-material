import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FamilyEvent, FamilyMember, ActivityCategory, RecurrenceSlot, TransportationDetails } from "@/types/event";
import { useAuth } from "./useAuth";

export function useEventsDB() {
  const { user } = useAuth();
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('family_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) throw error;

      const mappedEvents: FamilyEvent[] = (data || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category as ActivityCategory,
        participants: event.participants as FamilyMember[],
        transportation: event.transportation as TransportationDetails | undefined,
        startDate: new Date(event.start_date),
        endDate: event.end_date ? new Date(event.end_date) : undefined,
        location: event.location,
        notes: event.notes,
        color: event.color,
        recurrenceSlots: event.recurrence_slots as RecurrenceSlot[],
        createdAt: new Date(event.created_at),
        updatedAt: new Date(event.updated_at),
      }));

      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (event: FamilyEvent) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('family_events')
        .insert([{
          user_id: user.id,
          title: event.title,
          description: event.description,
          category: event.category,
          participants: event.participants,
          transportation: event.transportation as any,
          start_date: event.startDate.toISOString(),
          end_date: event.endDate?.toISOString(),
          location: event.location,
          notes: event.notes,
          color: event.color,
          recurrence_slots: event.recurrenceSlots as any,
        }]);

      if (error) throw error;

      await loadEvents();
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const updateEvent = async (id: string, updates: Partial<FamilyEvent>) => {
    if (!user) return;

    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.participants !== undefined) dbUpdates.participants = updates.participants;
      if (updates.transportation !== undefined) dbUpdates.transportation = updates.transportation;
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate.toISOString();
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate?.toISOString();
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.recurrenceSlots !== undefined) dbUpdates.recurrence_slots = updates.recurrenceSlots;

      const { error } = await supabase
        .from('family_events')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadEvents();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('family_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const deleteEventsByTitle = async (title: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('family_events')
        .delete()
        .eq('title', title)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadEvents();
    } catch (error) {
      console.error('Error deleting events by title:', error);
    }
  };

  const getEventById = (id: string): FamilyEvent | undefined => {
    return events.find(event => event.id === id);
  };

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    deleteEventsByTitle,
    getEventById,
  };
}
