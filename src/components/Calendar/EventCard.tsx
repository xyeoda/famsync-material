import { useState } from "react";
import { FamilyEvent, EventInstance, FamilyMember, RecurrenceSlot } from "@/types/event";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { useFamilySettingsContext } from "@/contexts/FamilySettingsContext";
import { useFamilyMembersContext } from "@/contexts/FamilyMembersContext";
import { LocationDetailsDialog } from "./LocationDetailsDialog";
import { useActivityLocations } from "@/hooks/useActivityLocations";
import { useHousehold } from "@/contexts/HouseholdContext";

interface EventCardProps {
  event: FamilyEvent;
  instance?: EventInstance;
  slot?: RecurrenceSlot;
  startTime: string;
  endTime: string;
  onClick?: () => void;
}

export function EventCard({ event, instance, slot, startTime, endTime, onClick }: EventCardProps) {
  const { getFamilyMemberName, settings } = useFamilySettingsContext();
  const { getKids, getAdults, getMemberColor: getDynamicMemberColor } = useFamilyMembersContext();
  const { householdId } = useHousehold();
  const { locations } = useActivityLocations(householdId);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  
  const kids = getKids();
  const adults = getAdults();
  
  const locationId = (event as any).location_id;
  const locationDetails = locationId ? locations.find(loc => loc.id === locationId) : null;
  
  const isCancelled = instance?.cancelled || false;
  
  // Get member color - supports both legacy format and dynamic members
  const getMemberColor = (member: string): string | null => {
    // Use context's getMemberColor which handles both legacy and UUID formats
    const { getMemberColor: getContextMemberColor, getMemberByLegacyId } = useFamilyMembersContext();
    
    // Check if it's a legacy format (parent1, parent2, housekeeper)
    if (member === "parent1") {
      const parent = getMemberByLegacyId('parent1');
      return parent?.color || settings.parent1Color;
    }
    if (member === "parent2") {
      const parent = getMemberByLegacyId('parent2');
      return parent?.color || settings.parent2Color;
    }
    if (member === "housekeeper") {
      const helper = getMemberByLegacyId('housekeeper');
      return helper?.color || settings.housekeeperColor;
    }
    // For UUIDs, use the context
    return getContextMemberColor(member);
  };

  // Use instance data if available, otherwise fall back to slot data, then event data
  const transportation = instance?.transportation || slot?.transportation || event.transportation;
  const participants = instance?.participants || event.participants;

  // Get kids participating in this event
  const kidsInvolved = participants.filter((p) => p === "kid1" || p === "kid2" || p.startsWith("kid"));
  
  // Get kid colors from dynamic members
  const getKidColor = (kidId: string, index: number) => {
    // Try to get from dynamic members first
    if (kids[index]) {
      return kids[index].color;
    }
    // Fallback to CSS variables
    return `var(--${kidId}-color)`;
  };
  
  // Determine border color based on kids involved
  const getBorderColor = () => {
    if (kidsInvolved.length >= 2) {
      // Multiple kids - return gradient string
      const kid1Color = kids[0]?.color ? `hsl(${kids[0].color})` : 'hsl(var(--kid1-color))';
      const kid2Color = kids[1]?.color ? `hsl(${kids[1].color})` : 'hsl(var(--kid2-color))';
      return `linear-gradient(to bottom, ${kid1Color}, ${kid2Color})`;
    } else if (kidsInvolved.length === 1) {
      // Single kid - show solid color
      const kidIndex = parseInt(kidsInvolved[0].replace('kid', '')) - 1;
      const kidColor = kids[kidIndex]?.color;
      return kidColor ? `hsl(${kidColor})` : `hsl(var(--${kidsInvolved[0]}-color))`;
    }
    // No kids - fallback to category color
    return `hsl(var(--category-${event.category}))`;
  };

  const borderColor = getBorderColor();
  const isGradient = kidsInvolved.length >= 2;

  const dropOffColor = transportation?.dropOffPerson
    ? getMemberColor(transportation.dropOffPerson)
    : null;
  const pickUpColor = transportation?.pickUpPerson
    ? getMemberColor(transportation.pickUpPerson)
    : null;

  const dropOffName = transportation?.dropOffPerson
    ? getFamilyMemberName(transportation.dropOffPerson).split(" ")[0]
    : null;
  const pickUpName = transportation?.pickUpPerson
    ? getFamilyMemberName(transportation.pickUpPerson).split(" ")[0]
    : null;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-2 lg:p-2 cursor-pointer hover:shadow-elevation-2 transition-standard overflow-hidden state-layer relative bg-card/70 backdrop-blur-md border-border/40",
        !isGradient && "border-l-4",
        isCancelled && "opacity-50"
      )}
      style={!isGradient ? { borderLeftColor: borderColor } : undefined}
    >
      {isGradient && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ 
            background: borderColor
          }}
        />
      )}
      {isCancelled && (
        <div className="absolute top-1 right-1 z-10">
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
            CANCELLED
          </Badge>
        </div>
      )}
      <div className="flex flex-col gap-1.5 lg:gap-1">
        <div className="flex items-start justify-between gap-2 lg:gap-1.5">
          <h4 className={cn(
            "font-medium text-sm lg:text-xs leading-tight line-clamp-2",
            isCancelled && "line-through"
          )}>
            {event.title}
          </h4>
          <span className="text-xs lg:text-[10px] text-muted-foreground whitespace-nowrap font-normal flex-shrink-0">
            {startTime} - {endTime}
          </span>
        </div>

        {event.location && (
          <div 
            className={cn(
              "flex items-center gap-1 text-xs lg:text-[10px] text-muted-foreground",
              locationDetails && "cursor-pointer hover:text-primary transition-colors"
            )}
            onClick={(e) => {
              if (locationDetails) {
                e.stopPropagation();
                setLocationDialogOpen(true);
              }
            }}
          >
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
        
        <LocationDetailsDialog
          location={locationDetails}
          open={locationDialogOpen}
          onOpenChange={setLocationDialogOpen}
        />

        <div className="flex flex-wrap gap-1 lg:gap-0.5">
          {participants.map((participant) => {
            const isKid = participant.startsWith('kid') || kids.some(k => k.id === participant);
            const { getMemberColor: getContextColor, getMemberName } = useFamilyMembersContext();
            const bgColor = getContextColor(participant);

            return (
              <span
                key={participant}
                className={`text-xs lg:text-[10px] px-1.5 py-0.5 rounded-full font-normal ${
                  isKid ? "bg-surface-container" : "text-white"
                }`}
                style={bgColor ? { backgroundColor: `hsl(${bgColor})` } : undefined}
              >
                {getMemberName(participant).split(" ")[0]}
              </span>
            );
          })}
        </div>


      </div>

      {/* Bottom transportation strip */}
      {(dropOffColor || pickUpColor) && (
        <div className="absolute bottom-0 left-0 right-0 flex h-1 rounded-b-lg overflow-hidden">
          <div 
            className="flex-1"
            style={{ backgroundColor: dropOffColor ? `hsl(${dropOffColor})` : 'hsl(var(--muted))' }}
          />
          <div 
            className="flex-1"
            style={{ backgroundColor: pickUpColor ? `hsl(${pickUpColor})` : 'hsl(var(--muted))' }}
          />
        </div>
      )}
    </Card>
  );
}
