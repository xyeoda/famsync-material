import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FamilySettings } from "@/hooks/useFamilySettings";
import { Palette } from "lucide-react";

// Color conversion utilities
function hslToHex(hsl: string): string {
  const [h, s, l] = hsl.split(' ').map((v, i) => {
    const num = parseFloat(v);
    return i === 0 ? num : num / 100;
  });
  
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

  const handleColorChange = (field: 'kid1Color' | 'kid2Color' | 'parent1Color' | 'parent2Color' | 'housekeeperColor', hex: string) => {
    const hsl = hexToHsl(hex);
    setLocalSettings((prev) => ({ ...prev, [field]: hsl }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/80 backdrop-blur-md border-border/50">
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
              <div className="flex gap-2">
                <Input
                  id="parent1Name"
                  value={localSettings.parent1Name}
                  onChange={(e) => handleChange("parent1Name", e.target.value)}
                  placeholder="e.g., Mom, Dad, Sarah"
                  className="flex-1"
                />
                <div className="relative">
                  <input
                    type="color"
                    value={hslToHex(localSettings.parent1Color)}
                    onChange={(e) => handleColorChange("parent1Color", e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Pick color"
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    size="icon"
                    className="h-10 w-10 pointer-events-none"
                    style={{ backgroundColor: `hsl(${localSettings.parent1Color})` }}
                  >
                    <Palette className="h-4 w-4" style={{ color: 'white', mixBlendMode: 'difference' }} />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="parent2Name">Parent 2</Label>
              <div className="flex gap-2">
                <Input
                  id="parent2Name"
                  value={localSettings.parent2Name}
                  onChange={(e) => handleChange("parent2Name", e.target.value)}
                  placeholder="e.g., Mom, Dad, John"
                  className="flex-1"
                />
                <div className="relative">
                  <input
                    type="color"
                    value={hslToHex(localSettings.parent2Color)}
                    onChange={(e) => handleColorChange("parent2Color", e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Pick color"
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    size="icon"
                    className="h-10 w-10 pointer-events-none"
                    style={{ backgroundColor: `hsl(${localSettings.parent2Color})` }}
                  >
                    <Palette className="h-4 w-4" style={{ color: 'white', mixBlendMode: 'difference' }} />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="housekeeperName">Helper</Label>
              <div className="flex gap-2">
                <Input
                  id="housekeeperName"
                  value={localSettings.housekeeperName}
                  onChange={(e) => handleChange("housekeeperName", e.target.value)}
                  placeholder="e.g., Nanny, Babysitter, Helper"
                  className="flex-1"
                />
                <div className="relative">
                  <input
                    type="color"
                    value={hslToHex(localSettings.housekeeperColor)}
                    onChange={(e) => handleColorChange("housekeeperColor", e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Pick color"
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    size="icon"
                    className="h-10 w-10 pointer-events-none"
                    style={{ backgroundColor: `hsl(${localSettings.housekeeperColor})` }}
                  >
                    <Palette className="h-4 w-4" style={{ color: 'white', mixBlendMode: 'difference' }} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Kids</h3>
            
            <div>
              <Label htmlFor="kid1Name">Kid 1</Label>
              <div className="flex gap-2">
                <Input
                  id="kid1Name"
                  value={localSettings.kid1Name}
                  onChange={(e) => handleChange("kid1Name", e.target.value)}
                  placeholder="e.g., Emma, Alex"
                  className="flex-1"
                />
                <div className="relative">
                  <input
                    type="color"
                    value={hslToHex(localSettings.kid1Color)}
                    onChange={(e) => handleColorChange("kid1Color", e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Pick color"
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    size="icon"
                    className="h-10 w-10 pointer-events-none"
                    style={{ backgroundColor: `hsl(${localSettings.kid1Color})` }}
                  >
                    <Palette className="h-4 w-4" style={{ color: 'white', mixBlendMode: 'difference' }} />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="kid2Name">Kid 2</Label>
              <div className="flex gap-2">
                <Input
                  id="kid2Name"
                  value={localSettings.kid2Name}
                  onChange={(e) => handleChange("kid2Name", e.target.value)}
                  placeholder="e.g., Oliver, Sophie"
                  className="flex-1"
                />
                <div className="relative">
                  <input
                    type="color"
                    value={hslToHex(localSettings.kid2Color)}
                    onChange={(e) => handleColorChange("kid2Color", e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Pick color"
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    size="icon"
                    className="h-10 w-10 pointer-events-none"
                    style={{ backgroundColor: `hsl(${localSettings.kid2Color})` }}
                  >
                    <Palette className="h-4 w-4" style={{ color: 'white', mixBlendMode: 'difference' }} />
                  </Button>
                </div>
              </div>
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
