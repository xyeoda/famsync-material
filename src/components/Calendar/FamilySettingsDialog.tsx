import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FamilySettings } from "@/hooks/useFamilySettings";

interface FamilySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: FamilySettings;
  onSave: (settings: FamilySettings) => void;
  onReset: () => void;
}

export function FamilySettingsDialog({ 
  open, 
  onOpenChange, 
  settings, 
  onSave,
  onReset 
}: FamilySettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<FamilySettings>(settings);

  const handleSave = () => {
    onSave(localSettings);
    onOpenChange(false);
  };

  const handleReset = () => {
    onReset();
    onOpenChange(false);
  };

  const handleChange = (field: keyof FamilySettings, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Family Settings</DialogTitle>
          <DialogDescription>
            Customize the names of your family members. These names will be used throughout the calendar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Parents / Helpers</h3>
            
            <div>
              <Label htmlFor="parent1Name">Parent 1</Label>
              <Input
                id="parent1Name"
                value={localSettings.parent1Name}
                onChange={(e) => handleChange("parent1Name", e.target.value)}
                placeholder="e.g., Mom, Dad, Sarah"
              />
            </div>

            <div>
              <Label htmlFor="parent2Name">Parent 2</Label>
              <Input
                id="parent2Name"
                value={localSettings.parent2Name}
                onChange={(e) => handleChange("parent2Name", e.target.value)}
                placeholder="e.g., Mom, Dad, John"
              />
            </div>

            <div>
              <Label htmlFor="housekeeperName">Helper</Label>
              <Input
                id="housekeeperName"
                value={localSettings.housekeeperName}
                onChange={(e) => handleChange("housekeeperName", e.target.value)}
                placeholder="e.g., Nanny, Babysitter, Helper"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Kids</h3>
            
            <div>
              <Label htmlFor="kid1Name">Kid 1</Label>
              <Input
                id="kid1Name"
                value={localSettings.kid1Name}
                onChange={(e) => handleChange("kid1Name", e.target.value)}
                placeholder="e.g., Emma, Alex"
              />
            </div>

            <div>
              <Label htmlFor="kid2Name">Kid 2</Label>
              <Input
                id="kid2Name"
                value={localSettings.kid2Name}
                onChange={(e) => handleChange("kid2Name", e.target.value)}
                placeholder="e.g., Oliver, Sophie"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outlined" onClick={handleReset}>
            Reset to Default
          </Button>
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <Button variant="text" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            <Button variant="filled" onClick={handleSave} className="flex-1 sm:flex-initial">
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
