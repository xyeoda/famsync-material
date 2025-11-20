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
  const { getFamilyMemberName, settings } = useFamilySettings();
  
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
        "p-2 lg:p-2 cursor-pointer hover:shadow-elevation-2 transition-standard overflow-hidden state-layer relative",
        !isGradient && "border-l-4"
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
          {event.participants.map((participant) => {
            const isKid = participant === "kid1" || participant === "kid2";
            const getParticipantColor = (p: FamilyMember) => {
              if (p === "parent1") return settings.parent1Color;
              if (p === "parent2") return settings.parent2Color;
              if (p === "housekeeper") return settings.housekeeperColor;
              return null;
            };

            const bgColor = getParticipantColor(participant);

            return (
              <span
                key={participant}
                className={`text-xs lg:text-[10px] px-1.5 py-0.5 rounded-full font-normal ${
                  isKid ? 'bg-surface-container' : 'text-white'
                }`}
                style={bgColor ? { backgroundColor: `hsl(${bgColor})` } : undefined}
              >
                {getFamilyMemberName(participant).split(" ")[0]}
              </span>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
