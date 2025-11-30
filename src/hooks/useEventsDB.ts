import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/app-client";
import { FamilyEvent, FamilyMember, ActivityCategory, RecurrenceSlot, TransportationDetails } from "@/types/event";
import { useAuth } from "./useAuth";

export function useEventsDB() {
  const { user } = useAuth();
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = async (forceHouseholdId?: string) => {
    try {
      let householdId = forceHouseholdId;
      
      // If no household ID provided, get it from user's roles
      if (!householdId && user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('household_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();
        
        if (roleData) {
          householdId = roleData.household_id;
        }
      }
      
      if (!householdId) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('family_events')
        .select('*')
        .eq('household_id', householdId)
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
        location_id: event.location_id,
        notes: event.notes,
        color: event.color,
        recurrenceSlots: event.recurrence_slots as RecurrenceSlot[],
        createdAt: new Date(event.created_at),
        updatedAt: new Date(event.updated_at),
      } as any));

      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (event: FamilyEvent, householdId: string) => {
    if (!user) return;

    try {
      const eventData: any = {
        user_id: user.id,
        household_id: householdId,
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
      };
      
      // Add location_id if present
      if ((event as any).location_id) {
        eventData.location_id = (event as any).location_id;
      }
      
      const { error } = await supabase
        .from('family_events')
        .insert([eventData]);

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
      if ((updates as any).location_id !== undefined) dbUpdates.location_id = (updates as any).location_id;

      const { error } = await supabase
        .from('family_events')
        .update(dbUpdates)
        .eq('id', id);

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
        .eq('id', id);

      if (error) throw error;

      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const deleteEventsByTitle = async (title: string) => {
    if (!user) return;

    try {
      // Get household_id first
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('household_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      
      if (!roleData) return;
      
      const { error } = await supabase
        .from('family_events')
        .delete()
        .eq('title', title)
        .eq('household_id', roleData.household_id);

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
    loadEvents,
  };
}
