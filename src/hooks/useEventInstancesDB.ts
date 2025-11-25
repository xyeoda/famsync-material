import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EventInstance, FamilyMember, TransportationDetails } from "@/types/event";
import { useAuth } from "./useAuth";

export function useEventInstancesDB() {
  const { user } = useAuth();
  const [instances, setInstances] = useState<EventInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadInstances();
    }
  }, [user]);

  const loadInstances = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('event_instances')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      const mappedInstances: EventInstance[] = (data || []).map((instance: any) => ({
        id: instance.id,
        eventId: instance.event_id,
        date: new Date(instance.date),
        transportation: instance.transportation as TransportationDetails | undefined,
        participants: instance.participants as FamilyMember[] | undefined,
        cancelled: instance.cancelled,
        createdAt: new Date(instance.created_at),
        updatedAt: new Date(instance.updated_at),
      }));

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

  const addInstance = async (instance: EventInstance) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_instances')
        .insert([{
          event_id: instance.eventId,
          user_id: user.id,
          date: instance.date.toISOString().split('T')[0],
          transportation: instance.transportation as any,
          participants: instance.participants,
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
      if (updates.participants !== undefined) dbUpdates.participants = updates.participants;
      if (updates.cancelled !== undefined) dbUpdates.cancelled = updates.cancelled;

      const { error } = await supabase
        .from('event_instances')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

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
        .eq('id', id)
        .eq('user_id', user.id);

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
  };
}
