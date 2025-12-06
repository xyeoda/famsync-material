import { useState } from "react";
import { Check, ChevronsUpDown, MapPin, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ActivityLocation } from "@/hooks/useActivityLocations";

interface LocationComboboxProps {
  locations: ActivityLocation[];
  value: string;
  locationId?: string;
  onChange: (location: string, locationId?: string) => void;
  onAddLocation?: (location: Omit<ActivityLocation, "id" | "created_at" | "updated_at">) => Promise<ActivityLocation | null>;
}

export function LocationCombobox({ locations, value, locationId, onChange, onAddLocation }: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: "",
    address: "",
    phone: "",
    phone_secondary: "",
    email: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const selectedLocation = locations.find((loc) => loc.id === locationId);

  const handleSelectLocation = (location: ActivityLocation) => {
    onChange(location.name, location.id);
    setOpen(false);
  };

  const handleCustomInput = (text: string) => {
    onChange(text, undefined);
  };

  const handleToggleCustom = () => {
    setCustomMode(!customMode);
    if (!customMode) {
      onChange(value, undefined);
    }
  };

  const handleOpenAddDialog = () => {
    setOpen(false);
    setNewLocation({
      name: "",
      address: "",
      phone: "",
      phone_secondary: "",
      email: "",
      notes: "",
    });
    setAddDialogOpen(true);
  };

  const handleSaveNewLocation = async () => {
    if (!newLocation.name.trim() || !onAddLocation) return;
    
    setSaving(true);
    try {
      const created = await onAddLocation({
        household_id: "", // Will be set by the hook
        name: newLocation.name.trim(),
        address: newLocation.address.trim() || undefined,
        phone: newLocation.phone.trim() || undefined,
        phone_secondary: newLocation.phone_secondary.trim() || undefined,
        email: newLocation.email.trim() || undefined,
        notes: newLocation.notes.trim() || undefined,
      });
      
      if (created) {
        onChange(created.name, created.id);
        setAddDialogOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {customMode ? (
          <Input
            value={value}
            onChange={(e) => handleCustomInput(e.target.value)}
            placeholder="Enter custom location"
            className="flex-1"
          />
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outlined"
                role="combobox"
                aria-expanded={open}
                className="flex-1 justify-between"
              >
                <span className="flex items-center gap-2 truncate">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  {selectedLocation ? selectedLocation.name : value || "Select location..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-surface-container z-50" align="start">
              <Command>
                <CommandInput placeholder="Search locations..." />
                <CommandList>
                  <CommandEmpty>No saved locations found.</CommandEmpty>
                  <CommandGroup>
                    {locations.map((location) => (
                      <CommandItem
                        key={location.id}
                        value={location.name}
                        onSelect={() => handleSelectLocation(location)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            locationId === location.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{location.name}</div>
                          {location.address && (
                            <div className="text-xs text-muted-foreground truncate">
                              {location.address}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {onAddLocation && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={handleOpenAddDialog}
                          className="text-primary"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add new location...
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
        <Button
          type="button"
          variant="outlined"
          size="sm"
          onClick={handleToggleCustom}
          className="whitespace-nowrap"
        >
          {customMode ? "Use Saved" : "Custom"}
        </Button>
      </div>
      {selectedLocation && (
        <p className="text-xs text-muted-foreground">
          {selectedLocation.address || "No address saved"}
        </p>
      )}

      {/* Add New Location Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md bg-surface">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="loc-name">Name *</Label>
              <Input
                id="loc-name"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                placeholder="e.g., BJJ Academy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-address">Address</Label>
              <Input
                id="loc-address"
                value={newLocation.address}
                onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                placeholder="123 Main St, City"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loc-phone">Phone</Label>
                <Input
                  id="loc-phone"
                  value={newLocation.phone}
                  onChange={(e) => setNewLocation({ ...newLocation, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loc-email">Email</Label>
                <Input
                  id="loc-email"
                  type="email"
                  value={newLocation.email}
                  onChange={(e) => setNewLocation({ ...newLocation, email: e.target.value })}
                  placeholder="info@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-notes">Notes</Label>
              <Textarea
                id="loc-notes"
                value={newLocation.notes}
                onChange={(e) => setNewLocation({ ...newLocation, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNewLocation} 
              disabled={!newLocation.name.trim() || saving}
            >
              {saving ? "Saving..." : "Save Location"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
