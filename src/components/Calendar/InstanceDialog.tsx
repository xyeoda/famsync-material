import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventInstance, FamilyMember, TransportMethod, TransportationDetails } from "@/types/event";
import { FAMILY_MEMBERS } from "@/types/event";
import { Car, Bus, PersonStanding, Bike } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";

interface InstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (instance: EventInstance) => void;
  onEditSeries?: () => void;
  onDeleteAll?: () => void;
  eventId: string;
  eventTitle: string;
  date: Date;
  instance?: EventInstance;
  defaultTransportation?: TransportationDetails;
}

export function InstanceDialog({ 
  open, 
  onOpenChange, 
  onSave,
  onEditSeries,
  onDeleteAll, 
  eventId, 
  eventTitle,
  date,
  instance,
  defaultTransportation 
}: InstanceDialogProps) {
  const [transportation, setTransportation] = useState<TransportationDetails>(
    instance?.transportation || defaultTransportation || {}
  );

  const handleSave = () => {
    const now = new Date();
    const newInstance: EventInstance = {
      id: instance?.id || uuidv4(),
      eventId,
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Edit {eventTitle} - {format(date, "MMM d, yyyy")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-sm text-muted-foreground bg-accent/10 p-3 rounded-lg">
            💡 Changes apply only to this date. Default transportation from the event series is pre-filled below—adjust as needed.
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
                      {(Object.keys(FAMILY_MEMBERS) as FamilyMember[]).map((member) => (
                        <SelectItem key={member} value={member}>
                          {FAMILY_MEMBERS[member]}
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
                      {(Object.keys(FAMILY_MEMBERS) as FamilyMember[]).map((member) => (
                        <SelectItem key={member} value={member}>
                          {FAMILY_MEMBERS[member]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            {onEditSeries && (
              <Button variant="outlined" onClick={onEditSeries} className="flex-1 sm:flex-initial">
                Edit Series
              </Button>
            )}
            {onDeleteAll && (
              <Button variant="outlined" onClick={onDeleteAll} className="flex-1 sm:flex-initial text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
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
