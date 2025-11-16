import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MemberType, MEMBER_TYPE_LABELS } from "@/types/family";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useToast } from "@/hooks/use-toast";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({ open, onOpenChange }: AddMemberDialogProps) {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [type, setType] = useState<MemberType>("kid");
  const [age, setAge] = useState("");
  const [canDrive, setCanDrive] = useState(false);
  const { addMember } = useFamilyMembers();
  const { toast } = useToast();

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the family member.",
        variant: "destructive",
      });
      return;
    }

    addMember({
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      type,
      age: age ? parseInt(age) : undefined,
      canDrive,
    });

    toast({
      title: "Member added",
      description: `${name} has been added to your family.`,
    });

    // Reset form
    setName("");
    setNickname("");
    setType("kid");
    setAge("");
    setCanDrive(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Emma, Alex, Sarah"
            />
          </div>

          <div>
            <Label htmlFor="nickname">Nickname (Optional)</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., Em, Lexi"
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as MemberType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(MEMBER_TYPE_LABELS) as MemberType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {MEMBER_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="age">Age (Optional)</Label>
            <Input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g., 8"
              min="0"
              max="120"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="canDrive"
              checked={canDrive}
              onCheckedChange={(checked) => setCanDrive(checked as boolean)}
            />
            <Label htmlFor="canDrive" className="cursor-pointer">
              Can drive
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="text" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="filled" onClick={handleSave}>
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
