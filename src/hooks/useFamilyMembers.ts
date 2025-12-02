import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/app-client";
import { FamilyMemberRecord, MemberType, HelperCategory, DEFAULT_MEMBER_COLORS } from "@/types/familyMember";
import { useAuth } from "./useAuth";

interface UseFamilyMembersResult {
  members: FamilyMemberRecord[];
  loading: boolean;
  error: string | null;
  addMember: (member: Omit<FamilyMemberRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<FamilyMemberRecord | null>;
  updateMember: (id: string, updates: Partial<FamilyMemberRecord>) => Promise<boolean>;
  deleteMember: (id: string) => Promise<boolean>;
  reorderMembers: (memberIds: string[]) => Promise<boolean>;
  getMembersByType: (type: MemberType) => FamilyMemberRecord[];
  getMemberById: (id: string) => FamilyMemberRecord | undefined;
  getKids: () => FamilyMemberRecord[];
  getAdults: () => FamilyMemberRecord[];
  getNextColor: (memberType: MemberType) => string;
  refresh: () => Promise<void>;
}

export function useFamilyMembers(householdId?: string): UseFamilyMembersResult {
  const { user } = useAuth();
  const [members, setMembers] = useState<FamilyMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!householdId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('family_members')
        .select('*')
        .eq('household_id', householdId)
        .order('member_type')
        .order('display_order');

      if (queryError) throw queryError;

      const mappedMembers: FamilyMemberRecord[] = (data || []).map(row => ({
        id: row.id,
        householdId: row.household_id,
        name: row.name,
        color: row.color,
        memberType: row.member_type as MemberType,
        helperCategory: row.helper_category as HelperCategory | undefined,
        displayOrder: row.display_order,
        isActive: row.is_active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      setMembers(mappedMembers);
    } catch (err: any) {
      console.error('Error loading family members:', err);
      setError(err.message || 'Failed to load family members');
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const getNextColor = useCallback((memberType: MemberType): string => {
    const existingColors = members
      .filter(m => m.memberType === memberType)
      .map(m => m.color);
    
    const availableColors = DEFAULT_MEMBER_COLORS[memberType];
    const unusedColor = availableColors.find(c => !existingColors.includes(c));
    
    return unusedColor || availableColors[existingColors.length % availableColors.length];
  }, [members]);

  const addMember = useCallback(async (
    member: Omit<FamilyMemberRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<FamilyMemberRecord | null> => {
    if (!householdId) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('family_members')
        .insert({
          household_id: member.householdId,
          name: member.name,
          color: member.color,
          member_type: member.memberType,
          helper_category: member.helperCategory || null,
          display_order: member.displayOrder,
          is_active: member.isActive,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newMember: FamilyMemberRecord = {
        id: data.id,
        householdId: data.household_id,
        name: data.name,
        color: data.color,
        memberType: data.member_type as MemberType,
        helperCategory: data.helper_category as HelperCategory | undefined,
        displayOrder: data.display_order,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setMembers(prev => [...prev, newMember]);
      return newMember;
    } catch (err: any) {
      console.error('Error adding family member:', err);
      setError(err.message || 'Failed to add family member');
      return null;
    }
  }, [householdId]);

  const updateMember = useCallback(async (
    id: string,
    updates: Partial<FamilyMemberRecord>
  ): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.memberType !== undefined) dbUpdates.member_type = updates.memberType;
      if (updates.helperCategory !== undefined) dbUpdates.helper_category = updates.helperCategory;
      if (updates.displayOrder !== undefined) dbUpdates.display_order = updates.displayOrder;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

      const { error: updateError } = await supabase
        .from('family_members')
        .update(dbUpdates)
        .eq('id', id);

      if (updateError) throw updateError;

      setMembers(prev => prev.map(m => 
        m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m
      ));
      return true;
    } catch (err: any) {
      console.error('Error updating family member:', err);
      setError(err.message || 'Failed to update family member');
      return false;
    }
  }, []);

  const deleteMember = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setMembers(prev => prev.filter(m => m.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error deleting family member:', err);
      setError(err.message || 'Failed to delete family member');
      return false;
    }
  }, []);

  const reorderMembers = useCallback(async (memberIds: string[]): Promise<boolean> => {
    try {
      const updates = memberIds.map((id, index) => ({
        id,
        display_order: index,
      }));

      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('family_members')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (updateError) throw updateError;
      }

      setMembers(prev => {
        const newMembers = [...prev];
        memberIds.forEach((id, index) => {
          const member = newMembers.find(m => m.id === id);
          if (member) member.displayOrder = index;
        });
        return newMembers.sort((a, b) => a.displayOrder - b.displayOrder);
      });
      return true;
    } catch (err: any) {
      console.error('Error reordering family members:', err);
      setError(err.message || 'Failed to reorder family members');
      return false;
    }
  }, []);

  const getMembersByType = useCallback((type: MemberType): FamilyMemberRecord[] => {
    return members.filter(m => m.memberType === type && m.isActive);
  }, [members]);

  const getMemberById = useCallback((id: string): FamilyMemberRecord | undefined => {
    return members.find(m => m.id === id);
  }, [members]);

  const getKids = useCallback((): FamilyMemberRecord[] => {
    return members.filter(m => m.memberType === 'kid' && m.isActive);
  }, [members]);

  const getAdults = useCallback((): FamilyMemberRecord[] => {
    return members.filter(m => (m.memberType === 'parent' || m.memberType === 'helper') && m.isActive);
  }, [members]);

  return {
    members,
    loading,
    error,
    addMember,
    updateMember,
    deleteMember,
    reorderMembers,
    getMembersByType,
    getMemberById,
    getKids,
    getAdults,
    getNextColor,
    refresh: loadMembers,
  };
}
