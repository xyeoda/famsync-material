import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface DuplicateConflict {
  uploadedEvent: any;
  existingEvent: any;
  matchScore: number;
  matchReasons: string[];
}

interface BulkEventReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: DuplicateConflict[];
  onResolve: (resolutions: Record<string, 'skip' | 'update' | 'create'>) => void;
}

export function BulkEventReviewDialog({
  open,
  onOpenChange,
  conflicts,
  onResolve,
}: BulkEventReviewDialogProps) {
  const [resolutions, setResolutions] = useState<Record<string, 'skip' | 'update' | 'create'>>({});

  const handleResolve = () => {
    onResolve(resolutions);
  };

  const handleResolutionChange = (index: number, value: 'skip' | 'update' | 'create') => {
    setResolutions(prev => ({
      ...prev,
      [index]: value,
    }));
  };

  const allResolved = conflicts.every((_, index) => resolutions[index]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Review Duplicate Conflicts ({conflicts.length})
          </DialogTitle>
          <DialogDescription>
            The system detected potential duplicates. Choose how to handle each conflict.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Uploaded Event</TableHead>
                <TableHead>Existing Event</TableHead>
                <TableHead>Match Info</TableHead>
                <TableHead className="w-[150px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conflicts.map((conflict, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold">{conflict.uploadedEvent.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(conflict.uploadedEvent.start_date), 'PPP')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conflict.uploadedEvent.participants?.join(', ')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold">{conflict.existingEvent.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(conflict.existingEvent.start_date), 'PPP')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conflict.existingEvent.participants?.join(', ')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline">
                        {conflict.matchScore}% match
                      </Badge>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {conflict.matchReasons.map((reason, i) => (
                          <div key={i}>• {reason}</div>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={resolutions[index]}
                      onValueChange={(value) => handleResolutionChange(index, value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip (ignore)</SelectItem>
                        <SelectItem value="update">Update existing</SelectItem>
                        <SelectItem value="create">Create new</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outlined" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleResolve} disabled={!allResolved}>
            Apply Resolutions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
