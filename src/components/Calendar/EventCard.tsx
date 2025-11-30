import { FamilyEvent, EventInstance, FAMILY_MEMBERS, FamilyMember } from "@/types/event";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { useFamilySettingsContext } from "@/contexts/FamilySettingsContext";

interface EventCardProps {
  event: FamilyEvent;
  instance?: EventInstance;
  startTime: string;
  endTime: string;
  onClick?: () => void;
}

export function EventCard({ event, instance, startTime, endTime, onClick }: EventCardProps) {
  const { getFamilyMemberName, settings } = useFamilySettingsContext();
  
  const isCancelled = instance?.cancelled || false;
  
  const getMemberColor = (member: FamilyMember) => {
    if (member === "parent1") return settings.parent1Color;
    if (member === "parent2") return settings.parent2Color;
    if (member === "housekeeper") return settings.housekeeperColor;
    return null;
  };

  // Use instance data if available, otherwise fall back to event data
  const transportation = instance?.transportation || event.transportation;
  const participants = instance?.participants || event.participants;

  // Get kids participating in this event
  const kidsInvolved = participants.filter((p) => p === "kid1" || p === "kid2");
  
  // Determine border color based on kids involved
  const getBorderColor = () => {
    if (kidsInvolved.length === 2) {
      // Both kids - return gradient string
      return 'linear-gradient(to bottom, hsl(var(--kid1-color)), hsl(var(--kid2-color)))';
    } else if (kidsInvolved.length === 1) {
      // Single kid - show solid color
      return `hsl(var(--${kidsInvolved[0]}-color))`;
    }
    // No kids - fallback to category color
    return `hsl(var(--category-${event.category}))`;
  };

  const borderColor = getBorderColor();
  const isGradient = kidsInvolved.length === 2;

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
          <div className="flex items-center gap-1 text-xs lg:text-[10px] text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1 lg:gap-0.5">
          {participants.map((participant) => {
            const isKid = participant === "kid1" || participant === "kid2";
            const bgColor = getMemberColor(participant);

            return (
              <span
                key={participant}
                className={`text-xs lg:text-[10px] px-1.5 py-0.5 rounded-full font-normal ${
                  isKid ? "bg-surface-container" : "text-white"
                }`}
                style={bgColor ? { backgroundColor: `hsl(${bgColor})` } : undefined}
              >
                {getFamilyMemberName(participant).split(" ")[0]}
              </span>
            );
          })}
        </div>

        {(dropOffName || pickUpName) && (
          <div className="flex justify-between items-center mt-1 text-[10px] text-muted-foreground">
            {dropOffName && <span>Drop: {dropOffName}</span>}
            {pickUpName && <span>Pick: {pickUpName}</span>}
          </div>
        )}

      </div>

      {/* Bottom transportation strip */}
      {(dropOffColor || pickUpColor) && (
        <div className="absolute bottom-0 left-0 right-0 flex h-1.5 rounded-b-lg overflow-hidden">
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
