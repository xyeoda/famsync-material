import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { FamilyEvent, FamilyMember, ActivityCategory, RecurrenceSlot, TransportMethod, TransportationDetails } from "@/types/event";
import { FAMILY_MEMBERS, EVENT_CATEGORIES } from "@/types/event";
import { Car, Bus, PersonStanding, Bike, ChevronDown, GripVertical } from "lucide-react";
import { Plus, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useFamilySettingsContext } from "@/contexts/FamilySettingsContext";
import { EventCard } from "./EventCard";
import { cn } from "@/lib/utils";

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
  const { getFamilyMemberName } = useFamilySettingsContext();
  
  // Detect if existing event is single-day
  const isExistingSingleDay = event?.startDate && event?.endDate && 
    event.startDate.toDateString() === event.endDate.toDateString();
  
  const [isRecurring, setIsRecurring] = useState(!isExistingSingleDay);
  const [title, setTitle] = useState(event?.title || "");
  const [category, setCategory] = useState<ActivityCategory>(event?.category || "other");
  const [location, setLocation] = useState(event?.location || "");
  const [startDate, setStartDate] = useState(
    event?.startDate ? event.startDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    event?.endDate ? event.endDate.toISOString().split("T")[0] : ""
  );
  const [singleDayStartTime, setSingleDayStartTime] = useState(
    event?.recurrenceSlots?.[0]?.startTime || "09:00"
  );
  const [singleDayEndTime, setSingleDayEndTime] = useState(
    event?.recurrenceSlots?.[0]?.endTime || "10:00"
  );
  const [recurrenceSlots, setRecurrenceSlots] = useState<RecurrenceSlot[]>(
    event?.recurrenceSlots || [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }]
  );
  const [participants, setParticipants] = useState<FamilyMember[]>(
    event?.participants || []
  );
  const [openSlotIndex, setOpenSlotIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync form state with event prop when it changes or dialog opens
  useEffect(() => {
    if (open) {
      const isExistingSingleDay = event?.startDate && event?.endDate && 
        event.startDate.toDateString() === event.endDate.toDateString();
      
      setIsRecurring(!isExistingSingleDay);
      setTitle(event?.title || "");
      setCategory(event?.category || "other");
      setLocation(event?.location || "");
      setStartDate(
        event?.startDate ? event.startDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
      );
      setEndDate(event?.endDate ? event.endDate.toISOString().split("T")[0] : "");
      setSingleDayStartTime(event?.recurrenceSlots?.[0]?.startTime || "09:00");
      setSingleDayEndTime(event?.recurrenceSlots?.[0]?.endTime || "10:00");
      setRecurrenceSlots(
        event?.recurrenceSlots || [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }]
      );
      setParticipants(event?.participants || []);
      setOpenSlotIndex(null);
      setDraggedIndex(null);
    }
  }, [open, event]);

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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSlots = [...recurrenceSlots];
    const draggedSlot = newSlots[draggedIndex];
    newSlots.splice(draggedIndex, 1);
    newSlots.splice(index, 0, draggedSlot);
    
    setRecurrenceSlots(newSlots);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    const now = new Date();
    
    let finalRecurrenceSlots = recurrenceSlots;
    let finalEndDate = endDate ? new Date(endDate) : undefined;
    
    // For single-day events, auto-generate the recurrence slot and set end date
    if (!isRecurring) {
      const eventDate = new Date(startDate);
      const dayOfWeek = eventDate.getDay();
      
      finalRecurrenceSlots = [{
        dayOfWeek,
        startTime: singleDayStartTime,
        endTime: singleDayEndTime,
      }];
      
      // Critical: Set end date equal to start date for single-day events
      finalEndDate = new Date(startDate);
    }
    
    const newEvent: FamilyEvent = {
      id: event?.id || uuidv4(),
      title,
      category,
      location: location || undefined,
      startDate: new Date(startDate),
      endDate: finalEndDate,
      recurrenceSlots: finalRecurrenceSlots,
      participants,
      createdAt: event?.createdAt || now,
      updatedAt: now,
    };
    onSave(newEvent);
    onOpenChange(false);
  };

  const isValid = title && participants.length > 0 && (
    isRecurring ? recurrenceSlots.length > 0 : (singleDayStartTime && singleDayEndTime)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-surface">
        <DialogHeader className="border-b border-outline/10 pb-4">
          <DialogTitle className="text-xl">{event ? "Edit Event" : "Create New Event"}</DialogTitle>
        </DialogHeader>

        <div className="grid lg:grid-cols-[1fr,350px] gap-6 py-6">
          <div className="space-y-5">
          
          {/* Event Type Toggle */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-surface-container border border-outline/20">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Event Type</Label>
              <p className="text-sm text-on-surface-variant">
                {isRecurring ? "This event repeats weekly on selected days" : "This event occurs on one specific date"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn("text-sm font-medium", !isRecurring && "text-on-surface-variant")}>
                Recurring
              </span>
              <Switch
                checked={!isRecurring}
                onCheckedChange={(checked) => setIsRecurring(!checked)}
              />
              <span className={cn("text-sm font-medium", isRecurring && "text-on-surface-variant")}>
                Single Day
              </span>
            </div>
          </div>
          
          {/* Participants - at the very top */}
          <div className="space-y-3 p-6 rounded-2xl bg-primary/5 border border-primary/20">
            <h3 className="font-semibold text-base text-primary">Which kids are attending?</h3>
            <div className="flex flex-wrap gap-3">
              {(["kid1", "kid2"] as FamilyMember[]).map((member) => {
                const isSelected = participants.includes(member);

                return (
                  <label key={member} className={cn(
                    "flex items-center gap-3 cursor-pointer px-5 py-3.5 rounded-xl transition-all border-2",
                    isSelected 
                      ? "bg-primary/10 border-primary shadow-sm" 
                      : "bg-surface-container border-outline/20 hover:border-outline/40"
                  )}>
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

          {/* Basic Info */}
          <div className="space-y-5 p-6 rounded-2xl bg-surface-container border border-outline/20">
            <h3 className="font-semibold text-base text-on-surface">Event Information</h3>
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Event Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., BJJ Training"
                className="bg-surface h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as ActivityCategory)}>
                  <SelectTrigger id="category" className="bg-surface h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container z-50">
                    {EVENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">Location (Optional)</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Gracie Barra"
                  className="bg-surface h-11"
                />
              </div>
            </div>
          </div>

          {/* Date Range for Recurring OR Single Day Date + Times */}
          {isRecurring ? (
            <div className="space-y-5 p-6 rounded-2xl bg-surface-container border border-outline/20">
              <h3 className="font-semibold text-base text-on-surface">Date Range</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-surface h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-medium">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-surface h-11"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 p-6 rounded-2xl bg-surface-container border border-outline/20">
              <h3 className="font-semibold text-base text-on-surface">Event Date & Time</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="singleDate" className="text-sm font-medium">Date</Label>
                  <Input
                    id="singleDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-surface h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="singleStartTime" className="text-sm font-medium">Start Time</Label>
                    <Input
                      id="singleStartTime"
                      type="time"
                      value={singleDayStartTime}
                      onChange={(e) => {
                        setSingleDayStartTime(e.target.value);
                        // Auto-compute end time (1 hour later)
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        const endHours = (hours + 1) % 24;
                        const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                        setSingleDayEndTime(endTime);
                      }}
                      className="bg-surface h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="singleEndTime" className="text-sm font-medium">End Time</Label>
                    <Input
                      id="singleEndTime"
                      type="time"
                      value={singleDayEndTime}
                      onChange={(e) => setSingleDayEndTime(e.target.value)}
                      className="bg-surface h-11"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recurrence Slots - Only show for recurring events */}
          {isRecurring && (
          <div className="space-y-5 p-6 rounded-2xl bg-surface-container border border-outline/20">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base text-on-surface">Weekly Schedule</h3>
              <Button onClick={handleAddSlot} variant="outlined" size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Time Slot
              </Button>
            </div>

            <div className="space-y-4">
              {recurrenceSlots.map((slot, index) => {
                const dayLabel = DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek)?.label || "Day";
                const slotTransportation = slot.transportation || {};
                
                return (
                  <Collapsible
                    key={index}
                    open={openSlotIndex === index}
                    onOpenChange={(open) => setOpenSlotIndex(open ? index : null)}
                  >
                    <div 
                      className="border-2 border-outline/20 rounded-xl overflow-hidden transition-all bg-surface shadow-sm hover:shadow-md"
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      style={{ 
                        opacity: draggedIndex === index ? 0.5 : 1,
                        cursor: 'move'
                      }}
                    >
                      {/* Slot Time Configuration */}
                      <div className="flex items-end gap-3 p-4">
                        <div className="flex items-center justify-center h-11 cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-5 w-5 text-on-surface-variant" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label className="text-sm font-medium">Day</Label>
                          <Select
                            value={slot.dayOfWeek.toString()}
                            onValueChange={(value) => handleSlotChange(index, "dayOfWeek", parseInt(value))}
                          >
                            <SelectTrigger className="bg-surface-container h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-surface-container z-50">
                              {DAYS_OF_WEEK.map((day) => (
                                <SelectItem key={day.value} value={day.value.toString()}>
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex-1 space-y-2">
                          <Label className="text-sm font-medium">Start Time</Label>
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => handleSlotChange(index, "startTime", e.target.value)}
                            className="bg-surface-container h-11"
                          />
                        </div>

                        <div className="flex-1 space-y-2">
                          <Label className="text-sm font-medium">End Time</Label>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => handleSlotChange(index, "endTime", e.target.value)}
                            className="bg-surface-container h-11"
                          />
                        </div>

                        {recurrenceSlots.length > 1 && (
                          <Button
                            variant="text"
                            size="icon"
                            onClick={() => handleRemoveSlot(index)}
                            className="h-11 w-11 text-destructive"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        )}
                      </div>

                      {/* Collapsible Transportation Section */}
                      <CollapsibleTrigger asChild>
                        <button className="w-full px-4 py-3 bg-surface-container/50 hover:bg-surface-container transition-colors flex items-center justify-between text-sm font-medium border-t border-outline/10">
                          <span className="flex items-center gap-2">
                            <ChevronDown className={`h-4 w-4 transition-transform ${openSlotIndex === index ? 'rotate-180' : ''}`} />
                            Transportation for {dayLabel}
                            {hasSlotTransportation(slot) && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Set</span>
                            )}
                          </span>
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="p-5 bg-surface-container/30 border-t border-outline/10">
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Drop-off */}
                            <div className="space-y-4">
                              <Label className="text-base font-semibold flex items-center gap-2">
                                <span>→</span> Drop-off
                              </Label>
                              
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Method</Label>
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

                              <div className="space-y-2">
                                <Label htmlFor={`dropOffPerson-${index}`} className="text-sm font-medium">
                                  Responsible Person
                                </Label>
                                <Select
                                  value={slotTransportation.dropOffPerson}
                                  onValueChange={(value) => handleSlotTransportationChange(index, { ...slotTransportation, dropOffPerson: value as FamilyMember })}
                                >
                                  <SelectTrigger id={`dropOffPerson-${index}`} className="bg-surface h-11">
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-surface-container z-50">
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
                            <div className="space-y-4">
                              <Label className="text-base font-semibold flex items-center gap-2">
                                <span>←</span> Pick-up
                              </Label>
                              
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Method</Label>
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

                              <div className="space-y-2">
                                <Label htmlFor={`pickUpPerson-${index}`} className="text-sm font-medium">
                                  Responsible Person
                                </Label>
                                <Select
                                  value={slotTransportation.pickUpPerson}
                                  onValueChange={(value) => handleSlotTransportationChange(index, { ...slotTransportation, pickUpPerson: value as FamilyMember })}
                                >
                                  <SelectTrigger id={`pickUpPerson-${index}`} className="bg-surface h-11">
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-surface-container z-50">
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
          )}
          </div>

          {/* Event Preview Panel */}
          <div className="hidden lg:block space-y-4 bg-surface-container/50 rounded-2xl p-5 border border-outline/20 sticky top-4">
            <h3 className="font-semibold text-base text-on-surface">
              Event Preview
            </h3>
            
            {title && participants.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-on-surface-variant mb-3">
                  Preview of how your event will appear:
                </p>
                {(isRecurring ? recurrenceSlots : [{
                  dayOfWeek: new Date(startDate).getDay(),
                  startTime: singleDayStartTime,
                  endTime: singleDayEndTime,
                }]).map((slot, index) => {
                  const previewEvent: FamilyEvent = {
                    id: `preview-${index}`,
                    title: title || "Event Title",
                    category,
                    location,
                    startDate: new Date(startDate),
                    endDate: endDate ? new Date(endDate) : undefined,
                    recurrenceSlots: [slot],
                    participants,
                    transportation: slot.transportation,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };

                  const dayLabel = DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek)?.label || "Day";

                  return (
                    <div key={index} className="space-y-1">
                      <div className="text-xs font-medium text-on-surface-variant flex items-center gap-2">
                        <GripVertical className="h-3 w-3" />
                        {dayLabel}
                      </div>
                      <EventCard
                        event={previewEvent}
                        startTime={slot.startTime}
                        endTime={slot.endTime}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-on-surface-variant/60 text-center py-8">
                Fill in event details to see preview
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row justify-between items-center border-t border-outline/10 pt-4">
          {event && (
            <Button 
              variant="text" 
              onClick={() => {
                const count = 1; // This will be passed from parent
                if (window.confirm(`Delete all events named "${event.title}"? This cannot be undone.`)) {
                  onOpenChange(false);
                }
              }}
              className="text-destructive hover:bg-destructive/10"
            >
              Delete All
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button variant="outlined" onClick={() => onOpenChange(false)} className="min-w-24">
              Cancel
            </Button>
            <Button variant="filled" onClick={handleSave} disabled={!isValid} className="min-w-32">
              {event ? "Update Series" : "Create Event"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
