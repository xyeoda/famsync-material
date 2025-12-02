import { useState } from "react";
import { Plus, Trash2, GripVertical, User, Baby, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFamilyMembersContext } from "@/contexts/FamilyMembersContext";
import { useHousehold } from "@/contexts/HouseholdContext";
import { FamilyMemberRecord, MemberType, HelperCategory, HELPER_CATEGORIES, MEMBER_TYPE_LABELS } from "@/types/familyMember";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Color conversion utilities
function hslToHex(hsl: string): string {
  const parts = hsl.split(' ');
  if (parts.length < 3) return '#808080';
  
  const h = parseFloat(parts[0]) || 0;
  const s = parseFloat(parts[1]) / 100 || 0;
  const l = parseFloat(parts[2]) / 100 || 0;
  
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  
  const r = f(0).toString(16).padStart(2, '0');
  const g = f(8).toString(16).padStart(2, '0');
  const b = f(4).toString(16).padStart(2, '0');
  
  return `#${r}${g}${b}`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return `${h} ${s}% ${l}%`;
}

interface MemberRowProps {
  member: FamilyMemberRecord;
  onUpdate: (id: string, updates: Partial<FamilyMemberRecord>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

function MemberRow({ member, onUpdate, onDelete }: MemberRowProps) {
  const [name, setName] = useState(member.name);
  const [helperCategory, setHelperCategory] = useState<HelperCategory | undefined>(member.helperCategory);
  const { toast } = useToast();

  const handleNameBlur = async () => {
    if (name !== member.name && name.trim()) {
      const success = await onUpdate(member.id, { name: name.trim() });
      if (!success) {
        setName(member.name);
        toast({ title: "Error", description: "Failed to update name", variant: "destructive" });
      }
    }
  };

  const handleColorChange = async (hex: string) => {
    const hsl = hexToHsl(hex);
    await onUpdate(member.id, { color: hsl });
  };

  const handleCategoryChange = async (category: HelperCategory) => {
    setHelperCategory(category);
    await onUpdate(member.id, { helperCategory: category });
  };

  const handleDelete = async () => {
    const success = await onDelete(member.id);
    if (!success) {
      toast({ title: "Error", description: "Failed to delete member", variant: "destructive" });
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container/50 border border-outline/10 hover:border-outline/30 transition-colors">
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
      
      <div 
        className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-outline/20"
        style={{ backgroundColor: `hsl(${member.color})` }}
      />
      
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleNameBlur}
        className="flex-1 h-9 bg-surface"
        placeholder="Enter name..."
      />
      
      {member.memberType === 'helper' && (
        <Select value={helperCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-32 h-9 bg-surface">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(HELPER_CATEGORIES) as HelperCategory[]).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {HELPER_CATEGORIES[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      <input
        type="color"
        value={hslToHex(member.color)}
        onChange={(e) => handleColorChange(e.target.value)}
        className="h-9 w-12 rounded border border-input cursor-pointer"
      />
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {member.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {member.name} from your family. Events referencing this member will need to be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface MemberSectionProps {
  title: string;
  icon: React.ReactNode;
  memberType: MemberType;
  members: FamilyMemberRecord[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<FamilyMemberRecord>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

function MemberSection({ title, icon, memberType, members, onAdd, onUpdate, onDelete }: MemberSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-medium text-sm">{title}</h4>
          <span className="text-xs text-muted-foreground">({members.length})</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onAdd} className="gap-1.5 h-8">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
      
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3 text-center">
          No {title.toLowerCase()} added yet
        </p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FamilyMembersCard() {
  const { householdId } = useHousehold();
  const {
    members,
    loading,
    addMember,
    updateMember,
    deleteMember,
    getMembersByType,
    getNextColor,
  } = useFamilyMembersContext();
  const { toast } = useToast();

  const handleAddMember = async (memberType: MemberType, helperCategory?: HelperCategory) => {
    if (!householdId) return;

    const existingOfType = getMembersByType(memberType);
    const defaultName = memberType === 'helper' && helperCategory
      ? HELPER_CATEGORIES[helperCategory]
      : `${MEMBER_TYPE_LABELS[memberType]} ${existingOfType.length + 1}`;

    const newMember = await addMember({
      householdId,
      name: defaultName,
      color: getNextColor(memberType),
      memberType,
      helperCategory: memberType === 'helper' ? (helperCategory || 'other') : undefined,
      displayOrder: existingOfType.length,
      isActive: true,
    });

    if (newMember) {
      toast({
        title: "Member Added",
        description: `${defaultName} has been added to your family`,
      });
    }
  };

  const parents = getMembersByType('parent');
  const kids = getMembersByType('kid');
  const helpers = getMembersByType('helper');

  if (loading) {
    return (
      <Card className="bg-card/80 backdrop-blur-md border-border/50">
        <CardHeader>
          <CardTitle>Family Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-md border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-primary" />
          <CardTitle>Family Members</CardTitle>
        </div>
        <CardDescription>
          Add and manage your family members. Each member can be assigned to events and have their own color.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <MemberSection
          title="Parents"
          icon={<User className="h-4 w-4 text-primary" />}
          memberType="parent"
          members={parents}
          onAdd={() => handleAddMember('parent')}
          onUpdate={updateMember}
          onDelete={deleteMember}
        />
        
        <div className="border-t border-outline/20 pt-6">
          <MemberSection
            title="Kids"
            icon={<Baby className="h-4 w-4 text-primary" />}
            memberType="kid"
            members={kids}
            onAdd={() => handleAddMember('kid')}
            onUpdate={updateMember}
            onDelete={deleteMember}
          />
        </div>
        
        <div className="border-t border-outline/20 pt-6">
          <MemberSection
            title="Helpers"
            icon={<UsersIcon className="h-4 w-4 text-primary" />}
            memberType="helper"
            members={helpers}
            onAdd={() => handleAddMember('helper', 'other')}
            onUpdate={updateMember}
            onDelete={deleteMember}
          />
        </div>
      </CardContent>
    </Card>
  );
}
