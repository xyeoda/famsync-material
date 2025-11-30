import { useState } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ActivityLocation } from "@/hooks/useActivityLocations";

interface LocationComboboxProps {
  locations: ActivityLocation[];
  value: string;
  locationId?: string;
  onChange: (location: string, locationId?: string) => void;
}

export function LocationCombobox({ locations, value, locationId, onChange }: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);

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
            <PopoverContent className="w-full p-0" align="start">
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
    </div>
  );
}
