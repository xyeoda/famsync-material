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
        "p-2 lg:p-2 border-l-4 cursor-pointer hover:shadow-elevation-2 transition-standard overflow-hidden state-layer",
        categoryClass
      )}
      style={{ borderLeftColor: `hsl(var(--category-${event.category}))` }}
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

        {drivers.length > 0 && (
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs lg:text-[10px] py-0.5 px-1.5 h-4 font-normal rounded-full">
              🚗 {drivers.join(", ")}
            </Badge>
          </div>
        )}

        <div className="flex flex-wrap gap-1 lg:gap-0.5">
          {event.participants.map((participant) => (
            <span
              key={participant.member}
              className="text-xs lg:text-[10px] bg-surface-container px-1.5 py-0.5 rounded-full font-normal"
            >
              {FAMILY_MEMBERS[participant.member].split(" ")[0]}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
