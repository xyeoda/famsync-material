import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FamilyEvent, FamilyMember, ActivityCategory, RecurrenceSlot, TransportMethod, TransportationDetails } from "@/types/event";
import { FAMILY_MEMBERS, EVENT_CATEGORIES } from "@/types/event";
import { Car, Bus, PersonStanding, Bike, ChevronDown } from "lucide-react";
import { Plus, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useFamilySettings } from "@/hooks/useFamilySettings";

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

export function EventDialog({ open, onOpenChange, onSave, event }: EventDialogProps) {
  const { getFamilyMemberName } = useFamilySettings();
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
  const [participants, setParticipants] = useState<FamilyMember[]>(
    event?.participants || []
  );
  const [openSlotIndex, setOpenSlotIndex] = useState<number | null>(null);

  const handleAddSlot = () => {
    setRecurrenceSlots([...recurrenceSlots, { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }]);
  };

  const handleRemoveSlot = (index: number) => {
    setRecurrenceSlots(recurrenceSlots.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index: number, field: keyof RecurrenceSlot, value: any) => {
    const updated = [...recurrenceSlots];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-compute end time when start time changes
    if (field === "startTime" && value) {
      const [hours, minutes] = value.split(':').map(Number);
      const endHours = (hours + 1) % 24;
      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      updated[index] = { ...updated[index], startTime: value, endTime };
    }
    
    setRecurrenceSlots(updated);
  };

  const handleSlotTransportationChange = (index: number, transportation: TransportationDetails) => {
    const updated = [...recurrenceSlots];
    updated[index] = { ...updated[index], transportation };
    setRecurrenceSlots(updated);
  };

  const hasSlotTransportation = (slot: RecurrenceSlot) => {
    return slot.transportation && (
      slot.transportation.dropOffMethod || 
      slot.transportation.dropOffPerson || 
      slot.transportation.pickUpMethod || 
      slot.transportation.pickUpPerson
    );
  };

  const handleParticipantToggle = (member: FamilyMember) => {
    if (participants.includes(member)) {
      setParticipants(participants.filter(p => p !== member));
    } else {
      setParticipants([...participants, member]);
    }
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/80 backdrop-blur-md border-border/50">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create New Event"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Participants - at the very top */}
          <div className="space-y-3 p-5 rounded-xl bg-surface-container/50 border border-outline/20 shadow-sm">
            <h3 className="font-semibold text-base text-on-surface">Which kids are attending?</h3>
            <div className="flex flex-wrap gap-3">
              {(["kid1", "kid2"] as FamilyMember[]).map((member) => {
                const isSelected = participants.includes(member);

                return (
                  <label key={member} className="flex items-center gap-2 cursor-pointer px-4 py-3 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors border border-outline/10">
                    <Checkbox
                      id={member}
                      checked={isSelected}
                      onCheckedChange={() => handleParticipantToggle(member)}
                    />
                    <span className="text-sm font-medium">
                      {getFamilyMemberName(member)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Basic Info - with colored background */}
          <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h3 className="font-semibold text-sm text-primary mb-2">Event Information</h3>
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

          {/* Recurrence Slots - with colored background */}
          <div className="space-y-4 p-4 rounded-lg bg-secondary/5 border border-secondary/10">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-secondary">Weekly Schedule</h3>
              <Button onClick={handleAddSlot} variant="text" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Time Slot
              </Button>
            </div>

            <div className="space-y-3">
              {recurrenceSlots.map((slot, index) => {
                const dayLabel = DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek)?.label || "Day";
                const slotTransportation = slot.transportation || {};
                
                return (
                  <Collapsible
                    key={index}
                    open={openSlotIndex === index}
                    onOpenChange={(open) => setOpenSlotIndex(open ? index : null)}
                  >
                    <div className="border border-border/50 rounded-lg overflow-hidden">
                      {/* Slot Time Configuration */}
                      <div className="flex items-end gap-2 p-3 bg-surface-container">
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

                      {/* Collapsible Transportation Section */}
                      <CollapsibleTrigger asChild>
                        <button className="w-full px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest transition-colors flex items-center justify-between text-sm font-medium">
                          <span className="flex items-center gap-2">
                            <ChevronDown className={`h-4 w-4 transition-transform ${openSlotIndex === index ? 'rotate-180' : ''}`} />
                            Transportation for {dayLabel}
                            {hasSlotTransportation(slot) && (
                              <span className="text-xs text-primary">(Set)</span>
                            )}
                          </span>
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="p-4 bg-surface-container-low border-t border-border/30">
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Drop-off */}
                            <div className="space-y-3">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <span>→</span> Drop-off
                              </Label>
                              
                              <div>
                                <Label className="text-xs text-on-surface-variant mb-2 block">Method</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { value: "car" as TransportMethod, icon: Car, label: "Car" },
                                    { value: "bus" as TransportMethod, icon: Bus, label: "Bus" },
                                    { value: "walk" as TransportMethod, icon: PersonStanding, label: "Walk" },
                                    { value: "bike" as TransportMethod, icon: Bike, label: "Bike" },
                                  ].map(({ value, icon: Icon, label }) => (
                                    <Button
                                      key={value}
                                      type="button"
                                      variant={slotTransportation.dropOffMethod === value ? "filled" : "outlined"}
                                      size="sm"
                                      onClick={() => handleSlotTransportationChange(index, { ...slotTransportation, dropOffMethod: value })}
                                      className="justify-start gap-2"
                                    >
                                      <Icon className="h-4 w-4" />
                                      {label}
                                    </Button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label htmlFor={`dropOffPerson-${index}`} className="text-xs text-on-surface-variant mb-2 block">
                                  Responsible Person
                                </Label>
                                <Select
                                  value={slotTransportation.dropOffPerson}
                                  onValueChange={(value) => handleSlotTransportationChange(index, { ...slotTransportation, dropOffPerson: value as FamilyMember })}
                                >
                                  <SelectTrigger id={`dropOffPerson-${index}`}>
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(Object.keys(FAMILY_MEMBERS) as FamilyMember[])
                                      .filter((member) => member !== "kid1" && member !== "kid2")
                                      .map((member) => (
                                        <SelectItem key={member} value={member}>
                                          {getFamilyMemberName(member)}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Pick-up */}
                            <div className="space-y-3">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <span>←</span> Pick-up
                              </Label>
                              
                              <div>
                                <Label className="text-xs text-on-surface-variant mb-2 block">Method</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { value: "car" as TransportMethod, icon: Car, label: "Car" },
                                    { value: "bus" as TransportMethod, icon: Bus, label: "Bus" },
                                    { value: "walk" as TransportMethod, icon: PersonStanding, label: "Walk" },
                                    { value: "bike" as TransportMethod, icon: Bike, label: "Bike" },
                                  ].map(({ value, icon: Icon, label }) => (
                                    <Button
                                      key={value}
                                      type="button"
                                      variant={slotTransportation.pickUpMethod === value ? "filled" : "outlined"}
                                      size="sm"
                                      onClick={() => handleSlotTransportationChange(index, { ...slotTransportation, pickUpMethod: value })}
                                      className="justify-start gap-2"
                                    >
                                      <Icon className="h-4 w-4" />
                                      {label}
                                    </Button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label htmlFor={`pickUpPerson-${index}`} className="text-xs text-on-surface-variant mb-2 block">
                                  Responsible Person
                                </Label>
                                <Select
                                  value={slotTransportation.pickUpPerson}
                                  onValueChange={(value) => handleSlotTransportationChange(index, { ...slotTransportation, pickUpPerson: value as FamilyMember })}
                                >
                                  <SelectTrigger id={`pickUpPerson-${index}`}>
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(Object.keys(FAMILY_MEMBERS) as FamilyMember[])
                                      .filter((member) => member !== "kid1" && member !== "kid2")
                                      .map((member) => (
                                        <SelectItem key={member} value={member}>
                                          {getFamilyMemberName(member)}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </div>

        </div>

        <DialogFooter className="flex-row justify-between items-center">
          {event && (
            <Button 
              variant="text" 
              onClick={() => {
                const count = 1; // This will be passed from parent
                if (window.confirm(`Delete all events named "${event.title}"? This cannot be undone.`)) {
                  onOpenChange(false);
                }
              }}
              className="text-destructive"
            >
              Delete All
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="text" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="filled" onClick={handleSave} disabled={!isValid}>
              {event ? "Update Series" : "Create Event"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
