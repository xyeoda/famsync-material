import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Home, Cog } from "lucide-react";
import { format } from "date-fns";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserRoleBadge } from "@/components/UserRoleBadge";
import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

interface CalendarHeaderProps {
  currentDate: Date;
  view: "week" | "month";
  onViewChange: (view: "week" | "month") => void;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
  onToday: () => void;
  onNewEvent: () => void;
  canEdit: boolean;
  userRole?: "parent" | "helper" | "kid" | null;
  user?: User | null;
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPreviousPeriod,
  onNextPeriod,
  onToday,
  onNewEvent,
  canEdit,
  userRole,
  user,
}: CalendarHeaderProps) {
  const title = view === "month" 
    ? format(currentDate, "MMMM yyyy")
    : format(currentDate, "MMMM yyyy");

  return (
    <>
      <div className="surface-elevation-2 rounded-3xl p-3 mb-4">
        {/* Mobile: Two rows */}
        <div className="flex flex-col gap-3 sm:hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="text"
                size="icon"
                asChild
                className="h-9 w-9 rounded-full"
                title="Back to Dashboard"
              >
                <Link to="..">
                  <Home className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="text"
                size="sm"
                onClick={onToday}
                className="text-sm"
              >
                {title}
              </Button>
              {user && userRole && <UserRoleBadge role={userRole} />}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="text"
                size="icon"
                onClick={onPreviousPeriod}
                className="h-9 w-9 rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="text"
                size="icon"
                onClick={onNextPeriod}
                className="h-9 w-9 rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-surface-container rounded-full p-1">
              <Button
                variant={view === "week" ? "filled" : "text"}
                size="sm"
                onClick={() => onViewChange("week")}
                className="h-8 px-3 text-sm"
              >
                Week
              </Button>
              <Button
                variant={view === "month" ? "filled" : "text"}
                size="sm"
                onClick={() => onViewChange("month")}
                className="h-8 px-3 text-sm"
              >
                Month
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              {canEdit && (
                <>
                  <Button
                    variant="outlined"
                    size="icon"
                    asChild
                    className="h-9 w-9"
                    title="Settings"
                  >
                    <Link to="../settings">
                      <Cog className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    onClick={onNewEvent}
                    variant="filled"
                    size="sm"
                    className="h-9"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="text-sm">New</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Desktop: Single row */}
        <div className="hidden sm:flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="text"
              size="icon"
              asChild
              className="h-9 w-9 rounded-full"
              title="Back to Dashboard"
            >
              <Link to="..">
                <Home className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="text"
              size="sm"
              onClick={onToday}
              className="text-sm"
              title={`Current: ${view === "month" ? format(currentDate, "MMMM yyyy") : `Week of ${format(currentDate, "MMM d, yyyy")}`}`}
            >
              {title}
            </Button>
            {user && userRole && <UserRoleBadge role={userRole} />}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="text"
                size="icon"
                onClick={onPreviousPeriod}
                className="h-9 w-9 rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="text"
                size="icon"
                onClick={onNextPeriod}
                className="h-9 w-9 rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 bg-surface-container rounded-full p-1">
              <Button
                variant={view === "week" ? "filled" : "text"}
                size="sm"
                onClick={() => onViewChange("week")}
                className="h-8 px-3 text-sm"
              >
                Week
              </Button>
              <Button
                variant={view === "month" ? "filled" : "text"}
                size="sm"
                onClick={() => onViewChange("month")}
                className="h-8 px-3 text-sm"
              >
                Month
              </Button>
            </div>

            {canEdit && (
              <>
                <Button
                  variant="outlined"
                  size="icon"
                  asChild
                  className="h-9 w-9"
                  title="Settings"
                >
                  <Link to="../settings">
                    <Cog className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  onClick={onNewEvent}
                  variant="filled"
                  size="sm"
                  className="h-9"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="text-sm">New Event</span>
                </Button>
              </>
            )}
            
            <div className="h-6 w-px bg-border" />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  );
}
