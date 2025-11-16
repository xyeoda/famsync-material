import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Settings } from "lucide-react";
import { format } from "date-fns";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";
import { FamilySettingsDialog } from "./FamilySettingsDialog";
import { useFamilySettings } from "@/hooks/useFamilySettings";

interface CalendarHeaderProps {
  currentDate: Date;
  view: "week" | "month";
  onViewChange: (view: "week" | "month") => void;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
  onToday: () => void;
  onNewEvent: () => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPreviousPeriod,
  onNextPeriod,
  onToday,
  onNewEvent,
}: CalendarHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings, updateSettings, resetSettings } = useFamilySettings();
  
  const title = view === "month" 
    ? format(currentDate, "MMMM yyyy")
    : format(currentDate, "MMMM yyyy");

  return (
    <>
      <div className="surface-elevation-2 rounded-3xl p-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="text"
              size="sm"
              onClick={onToday}
              className="text-sm"
              title={`Current: ${view === "month" ? format(currentDate, "MMMM yyyy") : `Week of ${format(currentDate, "MMM d, yyyy")}`}`}
            >
              {title}
            </Button>
            <ThemeToggle />
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

            <Button
              variant="text"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="h-9 w-9 rounded-full"
              title="Family Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>

            <Button
              onClick={onNewEvent}
              variant="filled"
              size="sm"
              className="h-9"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline text-sm">New Event</span>
              <span className="sm:hidden text-sm">New</span>
            </Button>
          </div>
        </div>
      </div>

      <FamilySettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={updateSettings}
        onReset={resetSettings}
      />
    </>
  );
}
