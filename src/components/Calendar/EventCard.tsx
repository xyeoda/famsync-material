import { FamilyEvent, FAMILY_MEMBERS, EVENT_ROLES } from "@/types/event";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: FamilyEvent;
  startTime: string;
  endTime: string;
  onClick?: () => void;
}

export function EventCard({ event, startTime, endTime, onClick }: EventCardProps) {
  const categoryClass = `category-${event.category}`;
  
  // Get unique drivers
  const drivers = event.participants
    .filter(p => p.roles.includes("driver"))
    .map(p => FAMILY_MEMBERS[p.member]);

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-4 lg:p-3 border-l-4 cursor-pointer hover:shadow-elevation-2 transition-standard overflow-hidden state-layer",
        categoryClass
      )}
      style={{ borderLeftColor: `hsl(var(--category-${event.category}))` }}
    >
      <div className="flex flex-col gap-2 lg:gap-1.5">
        <div className="flex items-start justify-between gap-3 lg:gap-2">
          <h4 className="font-medium text-base lg:text-sm leading-tight line-clamp-2">
            {event.title}
          </h4>
          <span className="text-xs text-muted-foreground whitespace-nowrap font-normal flex-shrink-0">
            {startTime} - {endTime}
          </span>
        </div>

        {event.location && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            📍 {event.location}
          </p>
        )}

        {drivers.length > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Badge variant="secondary" className="text-xs py-0.5 px-2 h-5 font-normal rounded-full">
              🚗 {drivers.join(", ")}
            </Badge>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 lg:gap-1 mt-0.5">
          {event.participants.map((participant) => (
            <span
              key={participant.member}
              className="text-xs bg-surface-container px-2 py-1 rounded-full font-normal"
            >
              {FAMILY_MEMBERS[participant.member].split(" ")[0]}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
