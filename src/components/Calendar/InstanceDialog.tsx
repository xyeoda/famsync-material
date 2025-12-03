import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventInstance, FamilyMember, TransportMethod, TransportationDetails, FamilyEvent } from "@/types/event";
import { Car, Bus, PersonStanding, Bike, Calendar, MapPin, Users, Clock } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { useFamilySettingsContext } from "@/contexts/FamilySettingsContext";
import { useFamilyMembersContext } from "@/contexts/FamilyMembersContext";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface InstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (instance: EventInstance) => void;
  onEditSeries?: () => void;
  onDeleteAll?: () => void;
  onDeleteInstance?: () => void;
  event: FamilyEvent;
  date: Date;
  slotDayOfWeek?: number;
  slotTransportation?: TransportationDetails;
  instance?: EventInstance;
}

export function InstanceDialog({ 
  open, 
  onOpenChange, 
  onSave,
  onEditSeries,
  onDeleteAll,
  onDeleteInstance,
  event,
  date,
  slotDayOfWeek,
  slotTransportation,
  instance,
}: InstanceDialogProps) {
  const { getFamilyMemberName } = useFamilySettingsContext();
  const { getAdults } = useFamilyMembersContext();
  const adults = getAdults();
  const [transportation, setTransportation] = useState<TransportationDetails>(
    instance?.transportation || slotTransportation || {}
  );

  const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = slotDayOfWeek !== undefined ? DAYS_OF_WEEK[slotDayOfWeek] : "this day";

  const handleSave = () => {
    const now = new Date();
    const newInstance: EventInstance = {
      id: instance?.id || uuidv4(),
      eventId: event.id,
      date,
      transportation,
      createdAt: instance?.createdAt || now,
      updatedAt: now,
    };
    onSave(newInstance);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card/80 backdrop-blur-md border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {format(date, "EEEE, MMMM d, yyyy")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Event Details Header - Non-editable */}
          <Card className="p-5 bg-surface-container/50 border-primary/20 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-semibold text-foreground">{event.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {event.location && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{event.location}</span>
                </div>
              )}

              <div className="flex items-start gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {format(event.startDate, "MMM d, yyyy")}
                  {event.endDate && ` - ${format(event.endDate, "MMM d, yyyy")}`}
                </span>
              </div>

              {event.recurrenceSlots.length > 0 && (
                <div className="flex items-start gap-2 text-muted-foreground md:col-span-2">
                  <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    {event.recurrenceSlots.map((slot, idx) => (
                      <div key={idx}>
                        {DAYS_OF_WEEK[slot.dayOfWeek]}: {slot.startTime} - {slot.endTime}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 text-muted-foreground md:col-span-2">
                <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {event.participants.map((participant) => (
                    <Badge key={participant} variant="outline" className="text-xs">
                      {getFamilyMemberName(participant)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40">
              <p className="text-xs text-muted-foreground italic">
                To edit event details (title, schedule, participants), use the "Edit Series" button below.
              </p>
            </div>
          </Card>

          {/* Instance-specific overrides */}
          <div className="text-sm text-muted-foreground bg-accent/10 p-3 rounded-lg">
            💡 Changes below apply only to this date. {slotTransportation ? `Pre-filled with ${dayName}'s defaults—adjust as needed.` : "Set transportation for this specific date."}
          </div>

          {/* Transportation */}
          <div className="space-y-4">
            <h3 className="font-medium">Transportation</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Drop-off */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <span>→</span> Drop-off
                </Label>
                
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Method</Label>
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
                        variant={transportation.dropOffMethod === value ? "filled" : "outlined"}
                        size="sm"
                        onClick={() => setTransportation({ ...transportation, dropOffMethod: value })}
                        className="justify-start gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="dropOffPerson" className="text-xs text-muted-foreground mb-2 block">
                    Responsible Person
                  </Label>
                  <Select
                    value={transportation.dropOffPerson}
                    onValueChange={(value) => setTransportation({ ...transportation, dropOffPerson: value as FamilyMember })}
                  >
                    <SelectTrigger id="dropOffPerson">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {adults.map((adult) => {
                        const legacyId = adult.memberType === 'parent' 
                          ? `parent${adults.filter(a => a.memberType === 'parent').indexOf(adult) + 1}`
                          : 'housekeeper';
                        return (
                          <SelectItem key={adult.id} value={legacyId}>
                            {adult.name}
                          </SelectItem>
                        );
                      })}
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
                  <Label className="text-xs text-muted-foreground mb-2 block">Method</Label>
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
                        variant={transportation.pickUpMethod === value ? "filled" : "outlined"}
                        size="sm"
                        onClick={() => setTransportation({ ...transportation, pickUpMethod: value })}
                        className="justify-start gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="pickUpPerson" className="text-xs text-muted-foreground mb-2 block">
                    Responsible Person
                  </Label>
                  <Select
                    value={transportation.pickUpPerson}
                    onValueChange={(value) => setTransportation({ ...transportation, pickUpPerson: value as FamilyMember })}
                  >
                    <SelectTrigger id="pickUpPerson">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {adults.map((adult) => {
                        const legacyId = adult.memberType === 'parent' 
                          ? `parent${adults.filter(a => a.memberType === 'parent').indexOf(adult) + 1}`
                          : 'housekeeper';
                        return (
                          <SelectItem key={adult.id} value={legacyId}>
                            {adult.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {onEditSeries && (
              <Button variant="outlined" onClick={onEditSeries} className="flex-1 sm:flex-initial">
                Edit Series
              </Button>
            )}
            {onDeleteInstance && !instance?.cancelled && (
              <Button 
                variant="outlined" 
                onClick={onDeleteInstance} 
                className="flex-1 sm:flex-initial text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Cancel This Instance
              </Button>
            )}
            {onDeleteInstance && instance?.cancelled && (
              <Button 
                variant="outlined" 
                onClick={() => {
                  // Restore by unmarking as cancelled
                  const restoredInstance = { ...instance, cancelled: false };
                  onSave(restoredInstance);
                }} 
                className="flex-1 sm:flex-initial text-primary border-primary hover:bg-primary hover:text-primary-foreground"
              >
                Restore This Instance
              </Button>
            )}
            {onDeleteAll && (
              <Button 
                variant="outlined" 
                onClick={onDeleteAll} 
                className="flex-1 sm:flex-initial text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Delete All
              </Button>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <Button variant="text" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            <Button variant="filled" onClick={handleSave} className="flex-1 sm:flex-initial">
              Save This Instance
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
