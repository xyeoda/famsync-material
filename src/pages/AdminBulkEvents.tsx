import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, FileJson, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BulkEventReviewDialog } from "@/components/Admin/BulkEventReviewDialog";
import { useSystemRole } from "@/hooks/useSystemRole";
import { useUserRole } from "@/hooks/useUserRole";

interface DuplicateConflict {
  uploadedEvent: any;
  existingEvent: any;
  matchScore: number;
  matchReasons: string[];
}

export default function AdminBulkEvents() {
  const { householdId } = useParams<{ householdId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSiteAdmin, loading: adminLoading } = useSystemRole();
  const { isParent, loading: roleLoading } = useUserRole(householdId || null);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [conflicts, setConflicts] = useState<DuplicateConflict[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [uploadedData, setUploadedData] = useState<any>(null);

  // Check access permissions
  useEffect(() => {
    if (!adminLoading && !roleLoading && !isSiteAdmin && !isParent) {
      toast({
        title: "Access Denied",
        description: "You must be a site admin or parent to access bulk event management",
        variant: "destructive",
      });
      navigate(householdId ? `/family/${householdId}` : '/');
    }
  }, [isSiteAdmin, isParent, adminLoading, roleLoading, navigate, householdId, toast]);

  if (adminLoading || roleLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-events', {
        method: 'POST',
      });

      if (error) throw error;

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data.events, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `events-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Exported ${data.events.length} events`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const text = await file.text();
      const events = JSON.parse(text);

      if (!Array.isArray(events)) {
        throw new Error('Invalid file format: Expected an array of events');
      }

      // Upload to edge function for processing
      const { data, error } = await supabase.functions.invoke('import-events', {
        body: { events },
      });

      if (error) throw error;

      if (data.conflicts && data.conflicts.length > 0) {
        setConflicts(data.conflicts);
        setUploadedData(events);
        setShowReviewDialog(true);
      } else {
        setUploadResult(data);
        toast({
          title: "Import successful",
          description: `Imported ${data.imported} events`,
        });
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleResolveConflicts = async (resolutions: Record<string, 'skip' | 'update' | 'create'>) => {
    setIsUploading(true);
    try {
      const { data, error } = await supabase.functions.invoke('resolve-event-conflicts', {
        body: {
          events: uploadedData,
          resolutions,
        },
      });

      if (error) throw error;

      setUploadResult(data);
      setShowReviewDialog(false);
      toast({
        title: "Conflicts resolved",
        description: `Processed ${data.imported + data.updated + data.skipped} events`,
      });
    } catch (error: any) {
      console.error('Resolution error:', error);
      toast({
        title: "Resolution failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="outlined" 
          onClick={() => navigate(isSiteAdmin ? '/admin' : `/family/${householdId}/settings`)}
        >
          ← Back to {isSiteAdmin ? 'Admin' : 'Settings'}
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bulk Event Management</h1>
          <p className="text-muted-foreground">
            Export events to JSON for editing, then re-import with smart duplicate detection
          </p>
        </div>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Events
            </CardTitle>
            <CardDescription>
              Download all household events as JSON format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileJson className="mr-2 h-4 w-4" />
                  Download Events JSON
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Events
            </CardTitle>
            <CardDescription>
              Upload edited JSON file. System will detect duplicates and prompt for review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Smart Duplicate Detection:</strong> The system uses fuzzy matching on event titles,
                checks date proximity, and compares participants to catch near-duplicates.
              </AlertDescription>
            </Alert>

            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild disabled={isUploading}>
                  <span className="cursor-pointer">
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Events JSON
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </div>

            {uploadResult && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-semibold">Import Summary:</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>✓ Imported: {uploadResult.imported} new events</li>
                      <li>✓ Updated: {uploadResult.updated} existing events</li>
                      <li>✓ Skipped: {uploadResult.skipped} duplicates</li>
                      {uploadResult.errors > 0 && (
                        <li className="text-destructive">✗ Errors: {uploadResult.errors}</li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle>Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Keep event IDs intact when updating existing events</li>
              <li>• Remove IDs to create new events from templates</li>
              <li>• Validate dates are in ISO format (YYYY-MM-DD)</li>
              <li>• Ensure participants array uses valid family member values</li>
              <li>• Check household_id matches your household</li>
              <li>• All imports are logged in the audit trail</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <BulkEventReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        conflicts={conflicts}
        onResolve={handleResolveConflicts}
      />
    </div>
  );
}
