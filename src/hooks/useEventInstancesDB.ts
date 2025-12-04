import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/app-client";
import { EventInstance, TransportationDetails } from "@/types/event";
import { useAuth } from "./useAuth";

export function useEventInstancesDB() {
  const { user } = useAuth();
  const [instances, setInstances] = useState<EventInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstances();
  }, [user]);

  const loadInstances = async (forceHouseholdId?: string) => {
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
        .from('event_instances')
        .select('*')
        .eq('household_id', householdId)
        .order('date', { ascending: true });

      if (error) throw error;

      const mappedInstances: EventInstance[] = (data || []).map((instance: any) => {
        // Prefer participant_ids (UUIDs) if available, fallback to legacy participants
        const participants = instance.participant_ids?.length > 0 
          ? instance.participant_ids 
          : (instance.participants || undefined);

        return {
          id: instance.id,
          eventId: instance.event_id,
          date: new Date(instance.date),
          transportation: instance.transportation as TransportationDetails | undefined,
          participants,
          cancelled: instance.cancelled,
          createdAt: new Date(instance.created_at),
          updatedAt: new Date(instance.updated_at),
        };
      });

      setInstances(mappedInstances);
    } catch (error) {
      console.error('Error loading instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInstanceForDate = (eventId: string, date: Date): EventInstance | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return instances.find(instance => {
      const instanceDateStr = instance.date.toISOString().split('T')[0];
      return instance.eventId === eventId && instanceDateStr === dateStr;
    });
  };

  const addInstance = async (instance: EventInstance, householdId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_instances')
        .insert([{
          event_id: instance.eventId,
          user_id: user.id,
          household_id: householdId,
          date: instance.date.toISOString().split('T')[0],
          transportation: instance.transportation as any,
          // Store in both columns for backwards compatibility
          participants: instance.participants as any,
          participant_ids: instance.participants as any,
          cancelled: instance.cancelled,
        }]);

      if (error) throw error;

      await loadInstances();
    } catch (error) {
      console.error('Error adding instance:', error);
    }
  };

  const updateInstance = async (id: string, updates: Partial<EventInstance>) => {
    if (!user) return;

    try {
      const dbUpdates: any = {};
      if (updates.transportation !== undefined) dbUpdates.transportation = updates.transportation;
      if (updates.participants !== undefined) {
        // Store in both columns for backwards compatibility
        dbUpdates.participants = updates.participants;
        dbUpdates.participant_ids = updates.participants;
      }
      if (updates.cancelled !== undefined) dbUpdates.cancelled = updates.cancelled;

      const { error } = await supabase
        .from('event_instances')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      await loadInstances();
    } catch (error) {
      console.error('Error updating instance:', error);
    }
  };

  const deleteInstance = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_instances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadInstances();
    } catch (error) {
      console.error('Error deleting instance:', error);
    }
  };

  return {
    instances,
    loading,
    getInstanceForDate,
    addInstance,
    updateInstance,
    deleteInstance,
    loadInstances,
  };
}
