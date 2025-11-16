import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Settings, LayoutDashboard } from "lucide-react";
import { format } from "date-fns";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";
import { FamilySettingsDialog } from "./FamilySettingsDialog";
import { useFamilySettings } from "@/hooks/useFamilySettings";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  
  const title = view === "month" 
    ? format(currentDate, "MMMM yyyy")
    : `Week of ${format(currentDate, "MMM d, yyyy")}`;

  return (
    <>
      <div className="surface-elevation-2 rounded-3xl p-3 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-normal text-foreground">{title}</h1>
            <Button
              variant="text"
              size="sm"
              onClick={onToday}
              className="hidden sm:inline-flex"
            >
              Today
            </Button>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1">
              <Button
                variant="text"
                size="icon"
                onClick={onPreviousPeriod}
                className="h-10 w-10 rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="text"
                size="icon"
                onClick={onNextPeriod}
                className="h-10 w-10 rounded-full"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-1 bg-surface-container rounded-full p-1">
              <Button
                variant={view === "week" ? "filled" : "text"}
                size="sm"
                onClick={() => onViewChange("week")}
                className="h-9 px-4"
              >
                Week
              </Button>
              <Button
                variant={view === "month" ? "filled" : "text"}
                size="sm"
                onClick={() => onViewChange("month")}
                className="h-9 px-4"
              >
                Month
              </Button>
            </div>

            <Button
              variant="text"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="h-10 w-10 rounded-full"
              title="Dashboard"
            >
              <LayoutDashboard className="h-5 w-5" />
            </Button>

            <Button
              variant="text"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="h-10 w-10 rounded-full"
              title="Family Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>

            <Button
              onClick={onNewEvent}
              variant="filled"
              className="ml-2"
            >
              <Plus className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">New Event</span>
              <span className="sm:hidden">New</span>
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
