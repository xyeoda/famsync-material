import { FamilyEvent, FAMILY_MEMBERS, FamilyMember } from "@/types/event";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Car, Bus, PersonStanding, Bike } from "lucide-react";
import { useFamilySettings } from "@/hooks/useFamilySettings";

interface EventCardProps {
  event: FamilyEvent;
  startTime: string;
  endTime: string;
  onClick?: () => void;
}

const transportIcons = {
  car: Car,
  bus: Bus,
  walk: PersonStanding,
  bike: Bike,
};

export function EventCard({ event, startTime, endTime, onClick }: EventCardProps) {
  const { getFamilyMemberName } = useFamilySettings();
  
  // Get kids participating in this event
  const kidsInvolved = event.participants.filter(p => p === "kid1" || p === "kid2");
  
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

  const DropOffIcon = event.transportation?.dropOffMethod ? transportIcons[event.transportation.dropOffMethod] : null;
  const PickUpIcon = event.transportation?.pickUpMethod ? transportIcons[event.transportation.pickUpMethod] : null;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-2 lg:p-2 border-l-4 cursor-pointer hover:shadow-elevation-2 transition-standard overflow-hidden state-layer",
        isGradient && "border-l-0 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-kid-kid1 before:to-kid-kid2"
      )}
      style={!isGradient ? { borderLeftColor: borderColor } : undefined}
    >
      <div className="flex flex-col gap-1.5 lg:gap-1">
        <div className="flex items-start justify-between gap-2 lg:gap-1.5">
          <h4 className="font-medium text-sm lg:text-xs leading-tight line-clamp-2">
            {event.title}
          </h4>
          <span className="text-xs lg:text-[10px] text-muted-foreground whitespace-nowrap font-normal flex-shrink-0">
            {startTime} - {endTime}
          </span>
        </div>

        {(event.transportation?.dropOffPerson || event.transportation?.pickUpPerson) && (
          <div className="flex items-center gap-1 flex-wrap">
            {event.transportation.dropOffPerson && DropOffIcon && (
              <Badge variant="secondary" className="text-xs lg:text-[10px] py-0.5 px-1.5 h-4 font-normal rounded-full flex items-center gap-1">
                <DropOffIcon className="h-3 w-3" />
                {getFamilyMemberName(event.transportation.dropOffPerson).split(" ")[0]}
              </Badge>
            )}
            {event.transportation.pickUpPerson && PickUpIcon && (
              <Badge variant="secondary" className="text-xs lg:text-[10px] py-0.5 px-1.5 h-4 font-normal rounded-full flex items-center gap-1">
                <PickUpIcon className="h-3 w-3" />
                {getFamilyMemberName(event.transportation.pickUpPerson).split(" ")[0]}
              </Badge>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1 lg:gap-0.5">
          {event.participants.map((participant) => (
            <span
              key={participant}
              className="text-xs lg:text-[10px] bg-surface-container px-1.5 py-0.5 rounded-full font-normal"
            >
              {getFamilyMemberName(participant).split(" ")[0]}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
