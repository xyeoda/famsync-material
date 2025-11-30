import { useState } from "react";
import { MapPin, Plus, Edit, Trash2, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useActivityLocations, ActivityLocation } from "@/hooks/useActivityLocations";

interface ActivityLocationsCardProps {
  householdId: string;
}

export function ActivityLocationsCard({ householdId }: ActivityLocationsCardProps) {
  const { locations, loading, addLocation, updateLocation, deleteLocation } = useActivityLocations(householdId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ActivityLocation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    phone_secondary: "",
    email: "",
    notes: "",
  });

  const handleOpenDialog = (location?: ActivityLocation) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        address: location.address || "",
        phone: location.phone || "",
        phone_secondary: location.phone_secondary || "",
        email: location.email || "",
        notes: location.notes || "",
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: "",
        address: "",
        phone: "",
        phone_secondary: "",
        email: "",
        notes: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    if (editingLocation) {
      await updateLocation(editingLocation.id, formData);
    } else {
      await addLocation({
        household_id: householdId,
        ...formData,
      });
    }

    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!locationToDelete) return;
    await deleteLocation(locationToDelete);
    setDeleteDialogOpen(false);
    setLocationToDelete(null);
  };

  const openDeleteDialog = (id: string) => {
    setLocationToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Card className="bg-card/80 backdrop-blur-md border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Activity Locations</CardTitle>
                <CardDescription>Manage locations with emergency contacts</CardDescription>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading locations...</p>
          ) : locations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity locations yet. Add one to get started.</p>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-container hover:bg-surface-container/80 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{location.name}</h4>
                    {location.address && (
                      <p className="text-xs text-muted-foreground truncate">{location.address}</p>
                    )}
                    <div className="flex gap-3 mt-1">
                      {location.phone && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {location.phone}
                        </span>
                      )}
                      {location.email && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {location.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(location)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(location.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLocation ? "Edit Location" : "Add Location"}</DialogTitle>
            <DialogDescription>
              Add details for quick access to emergency contacts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location-name">Name *</Label>
              <Input
                id="location-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Carpe Diem BJJ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-address">Address</Label>
              <Input
                id="location-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address for Google Maps"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location-phone">Primary Phone</Label>
                <Input
                  id="location-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+65 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location-phone-secondary">Secondary Phone</Label>
                <Input
                  id="location-phone-secondary"
                  type="tel"
                  value={formData.phone_secondary}
                  onChange={(e) => setFormData({ ...formData, phone_secondary: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-email">Email</Label>
              <Input
                id="location-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@location.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-notes">Notes</Label>
              <Textarea
                id="location-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional info (hours, pickup instructions, etc.)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outlined" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim()}>
              {editingLocation ? "Update" : "Add"} Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the location from your saved list. Events using this location will keep their location text but lose the link to contact details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
