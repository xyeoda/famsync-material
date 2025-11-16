import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FamilyEvent, FamilyMember, EventRole, ActivityCategory, RecurrenceSlot } from "@/types/event";
import { FAMILY_MEMBERS, EVENT_CATEGORIES } from "@/types/event";
import { Plus, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: FamilyEvent) => void;
  event?: FamilyEvent;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

interface ParticipantState {
  member: FamilyMember;
  roles: EventRole[];
}

export function EventDialog({ open, onOpenChange, onSave, event }: EventDialogProps) {
  const [title, setTitle] = useState(event?.title || "");
  const [category, setCategory] = useState<ActivityCategory>(event?.category || "other");
  const [location, setLocation] = useState(event?.location || "");
  const [startDate, setStartDate] = useState(
    event?.startDate ? event.startDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    event?.endDate ? event.endDate.toISOString().split("T")[0] : ""
  );
  const [recurrenceSlots, setRecurrenceSlots] = useState<RecurrenceSlot[]>(
    event?.recurrenceSlots || [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }]
  );
  const [participants, setParticipants] = useState<ParticipantState[]>(
    event?.participants || []
  );

  const handleAddSlot = () => {
    setRecurrenceSlots([...recurrenceSlots, { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }]);
  };

  const handleRemoveSlot = (index: number) => {
    setRecurrenceSlots(recurrenceSlots.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index: number, field: keyof RecurrenceSlot, value: any) => {
    const updated = [...recurrenceSlots];
    updated[index] = { ...updated[index], [field]: value };
    setRecurrenceSlots(updated);
  };

  const handleParticipantToggle = (member: FamilyMember) => {
    const existing = participants.find(p => p.member === member);
    if (existing) {
      setParticipants(participants.filter(p => p.member !== member));
    } else {
      setParticipants([...participants, { member, roles: [] }]);
    }
  };

  const handleRoleToggle = (member: FamilyMember, role: EventRole) => {
    const updated = participants.map(p => {
      if (p.member === member) {
        const hasRole = p.roles.includes(role);
        return {
          ...p,
          roles: hasRole ? p.roles.filter(r => r !== role) : [...p.roles, role]
        };
      }
      return p;
    });
    setParticipants(updated);
  };

  const handleSave = () => {
    const now = new Date();
    const newEvent: FamilyEvent = {
      id: event?.id || uuidv4(),
      title,
      category,
      location: location || undefined,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      recurrenceSlots,
      participants,
      createdAt: event?.createdAt || now,
      updatedAt: now,
    };
    onSave(newEvent);
    onOpenChange(false);
  };

  const isValid = title && recurrenceSlots.length > 0 && participants.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create New Event"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., BJJ Training"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as ActivityCategory)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Gracie Barra"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-4">
            <h3 className="font-medium">Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Recurrence Slots */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Weekly Schedule</h3>
              <Button onClick={handleAddSlot} variant="text" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Time Slot
              </Button>
            </div>

            <div className="space-y-3">
              {recurrenceSlots.map((slot, index) => (
                <div key={index} className="flex items-end gap-2 p-3 bg-surface-container rounded-lg">
                  <div className="flex-1">
                    <Label>Day</Label>
                    <Select
                      value={slot.dayOfWeek.toString()}
                      onValueChange={(value) => handleSlotChange(index, "dayOfWeek", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleSlotChange(index, "startTime", e.target.value)}
                    />
                  </div>

                  <div className="flex-1">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleSlotChange(index, "endTime", e.target.value)}
                    />
                  </div>

                  {recurrenceSlots.length > 1 && (
                    <Button
                      variant="text"
                      size="icon"
                      onClick={() => handleRemoveSlot(index)}
                      className="h-10 w-10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Participants & Roles */}
          <div className="space-y-4">
            <h3 className="font-medium">Participants & Roles</h3>
            <div className="space-y-3">
              {(Object.keys(FAMILY_MEMBERS) as FamilyMember[]).map((member) => {
                const participant = participants.find(p => p.member === member);
                const isSelected = !!participant;

                return (
                  <div key={member} className="p-3 bg-surface-container rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={member}
                        checked={isSelected}
                        onCheckedChange={() => handleParticipantToggle(member)}
                      />
                      <Label htmlFor={member} className="font-medium cursor-pointer">
                        {FAMILY_MEMBERS[member]}
                      </Label>
                    </div>

                    {isSelected && (
                      <div className="ml-6 flex flex-wrap gap-2">
                        {(["driver", "accompanies", "returns"] as EventRole[]).map((role) => (
                          <label key={role} className="flex items-center gap-1.5 cursor-pointer">
                            <Checkbox
                              checked={participant?.roles.includes(role)}
                              onCheckedChange={() => handleRoleToggle(member, role)}
                            />
                            <span className="text-sm">
                              {role === "driver" ? "🚗 Driver" : role === "accompanies" ? "👥 Accompany" : "🔙 Return"}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="text" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="filled" onClick={handleSave} disabled={!isValid}>
            {event ? "Update Event" : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
