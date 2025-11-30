import { MapPin, Phone, Mail, Navigation, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ActivityLocation } from "@/hooks/useActivityLocations";
import { useToast } from "@/hooks/use-toast";

interface LocationDetailsDialogProps {
  location: ActivityLocation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationDetailsDialog({ location, open, onOpenChange }: LocationDetailsDialogProps) {
  const { toast } = useToast();

  if (!location) return null;

  const handleOpenInMaps = () => {
    if (!location.address) return;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;
    window.open(mapsUrl, "_blank");
  };

  const handleCopyAddress = () => {
    if (!location.address) return;
    navigator.clipboard.writeText(location.address);
    toast({
      title: "Address Copied",
      description: "Address copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {location.name}
          </DialogTitle>
          <DialogDescription>Emergency contact details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {location.address && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </h4>
              <p className="text-sm text-muted-foreground">{location.address}</p>
              <div className="flex gap-2">
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={handleOpenInMaps}
                  className="gap-2 flex-1"
                >
                  <Navigation className="h-4 w-4" />
                  Open in Maps
                </Button>
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="gap-2 flex-1"
                >
                  <Copy className="h-4 w-4" />
                  Copy Address
                </Button>
              </div>
            </div>
          )}

          {(location.phone || location.phone_secondary || location.email) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Contact Information</h4>
                
                {location.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Primary
                    </span>
                    <a
                      href={`tel:${location.phone}`}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      {location.phone}
                    </a>
                  </div>
                )}

                {location.phone_secondary && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Secondary
                    </span>
                    <a
                      href={`tel:${location.phone_secondary}`}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      {location.phone_secondary}
                    </a>
                  </div>
                )}

                {location.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </span>
                    <a
                      href={`mailto:${location.email}`}
                      className="text-sm text-primary hover:underline font-medium truncate max-w-[200px]"
                    >
                      {location.email}
                    </a>
                  </div>
                )}
              </div>
            </>
          )}

          {location.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{location.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
