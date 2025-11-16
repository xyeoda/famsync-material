import { useState, useEffect } from "react";
import { FamilyMember, MemberType } from "@/types/family";
import { familyStore } from "@/lib/familyStore";

export function useFamilyMembers() {
  const [members, setMembers] = useState<FamilyMember[]>([]);

  useEffect(() => {
    setMembers(familyStore.getMembers());
    
    const unsubscribe = familyStore.subscribe(() => {
      setMembers(familyStore.getMembers());
    });

    return unsubscribe;
  }, []);

  return {
    members,
    addMember: (member: Omit<FamilyMember, "id" | "createdAt">) => familyStore.addMember(member),
    updateMember: (id: string, updates: Partial<FamilyMember>) => familyStore.updateMember(id, updates),
    deleteMember: (id: string) => familyStore.deleteMember(id),
    getMembersByType: (type: MemberType) => familyStore.getMembersByType(type),
    getMemberById: (id: string) => familyStore.getMemberById(id),
    getDrivers: () => familyStore.getDrivers(),
    getKids: () => familyStore.getKids(),
  };
}
