import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/app-client";
import { Plus, Copy, Trash2, Calendar, Download, Info } from "lucide-react";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useFamilySettings } from "@/hooks/useFamilySettings";

interface CalendarToken {
  id: string;
  name: string;
  token: string;
  filter_person: string | null;
  last_accessed_at: string | null;
  created_at: string;
}

export function CalendarSyncCard() {
  const { toast } = useToast();
  const { householdId } = useHousehold();
  const { settings } = useFamilySettings();
  const [tokens, setTokens] = useState<CalendarToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedName, setFeedName] = useState("");
  const [filterPerson, setFilterPerson] = useState<string>("all");

  useEffect(() => {
    if (householdId) {
      loadTokens();
    }
  }, [householdId]);

  const loadTokens = async () => {
    if (!householdId) return;

    const { data, error } = await supabase
      .from('calendar_tokens')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading calendar tokens:', error);
      return;
    }

    setTokens(data || []);
  };

  const createFeed = async () => {
    if (!householdId || !feedName.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate a secure random token
      const token = crypto.randomUUID() + '-' + Date.now();

      const { error } = await supabase
        .from('calendar_tokens')
        .insert({
          household_id: householdId,
          user_id: user.id,
          token,
          name: feedName,
          filter_person: filterPerson === 'all' ? null : filterPerson,
        });

      if (error) throw error;

      toast({
        title: "Calendar feed created",
        description: "You can now subscribe to this feed in your calendar app.",
      });

      setDialogOpen(false);
      setFeedName("");
      setFilterPerson("all");
      loadTokens();
    } catch (error) {
      console.error('Error creating feed:', error);
      toast({
        title: "Error",
        description: "Failed to create calendar feed.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteFeed = async (id: string) => {
    const { error } = await supabase
      .from('calendar_tokens')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete calendar feed.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Calendar feed deleted",
    });
    loadTokens();
  };

  const copyFeedUrl = (token: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const url = `${supabaseUrl}/functions/v1/calendar-feed?token=${token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied to clipboard",
      description: "Calendar feed URL copied.",
    });
  };

  const getFeedUrl = (token: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/calendar-feed?token=${token}`;
  };

  const downloadFeed = async (token: string, name: string) => {
    const url = getFeedUrl(token);
    try {
      const response = await fetch(url);
      const icsContent = await response.text();
      
      // Create a blob and trigger download
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${name.replace(/\s+/g, '-').toLowerCase()}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Download started",
        description: "Your calendar file is downloading.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download calendar file.",
        variant: "destructive",
      });
    }
  };

  const getFilterLabel = (filter: string | null) => {
    if (!filter) return "All family events";
    if (filter === "parent1") return settings?.parent1Name || "Parent 1";
    if (filter === "parent2") return settings?.parent2Name || "Parent 2";
    if (filter === "housekeeper") return settings?.housekeeperName || "Housekeeper";
    return filter;
  };

  return (
    <Card className="backdrop-blur-md bg-background/80 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Sync
        </CardTitle>
        <CardDescription>
          Subscribe to your family events in Google Calendar, Apple Calendar, or Outlook
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Calendar Feed
            </Button>
          </DialogTrigger>
          <DialogContent className="backdrop-blur-md bg-background/95">
            <DialogHeader>
              <DialogTitle>Create Calendar Feed</DialogTitle>
              <DialogDescription>
                Create a subscribable calendar feed to sync events to your personal calendar app.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="feed-name">Feed Name</Label>
                <Input
                  id="feed-name"
                  placeholder="e.g., My Family Events"
                  value={feedName}
                  onChange={(e) => setFeedName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filter">Filter Events</Label>
                <Select value={filterPerson} onValueChange={setFilterPerson}>
                  <SelectTrigger id="filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All family events</SelectItem>
                    <SelectItem value="parent1">{settings?.parent1Name || "Parent 1"} responsibilities</SelectItem>
                    <SelectItem value="parent2">{settings?.parent2Name || "Parent 2"} responsibilities</SelectItem>
                    <SelectItem value="housekeeper">{settings?.housekeeperName || "Housekeeper"} responsibilities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createFeed} disabled={loading || !feedName.trim()}>
                Create Feed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Info className="h-4 w-4" />
            Understanding Your Options
          </h4>
          
          <div className="space-y-2 text-sm">
            <div>
              <p className="font-medium text-green-400">📥 Subscribe (Copy URL)</p>
              <p className="text-muted-foreground">
                Your calendar app periodically fetches updates automatically. Changes in KinSynch
                appear in your calendar within 12-24 hours (Google) or 15 min - 1 week (Apple/Outlook).
                <strong> Recommended for ongoing sync.</strong>
              </p>
            </div>
            
            <div>
              <p className="font-medium text-blue-400">💾 Download ICS</p>
              <p className="text-muted-foreground">
                Get an immediate snapshot of your current events. Useful when you need the latest
                changes right now. <strong>One-time import, won't auto-update.</strong>
              </p>
            </div>
            
            <div className="border-t border-border/50 pt-2 mt-2">
              <p className="font-medium text-amber-400">⚠️ Avoid Duplicates</p>
              <p className="text-muted-foreground">
                Don't subscribe AND download the same feed to the same calendar — this creates
                duplicate events. Choose one method per calendar app.
              </p>
            </div>
          </div>
        </div>

        {tokens.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Your Calendar Feeds</h4>
            {tokens.map((token) => (
              <Card key={token.id} className="backdrop-blur-sm bg-background/60">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <p className="font-medium">{token.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getFilterLabel(token.filter_person)}
                      </p>
                      {token.last_accessed_at && (
                        <p className="text-xs text-muted-foreground">
                          Last synced: {new Date(token.last_accessed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFeed(token.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outlined"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyFeedUrl(token.token)}
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Copy URL
                    </Button>
                    <Button
                      variant="outlined"
                      size="sm"
                      className="flex-1"
                      onClick={() => downloadFeed(token.token, token.name)}
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Download ICS
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="instructions">
            <AccordionTrigger>Setup Instructions</AccordionTrigger>
            <AccordionContent className="space-y-4 text-sm">
              <div>
                <h5 className="font-medium mb-2">Google Calendar</h5>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Open Google Calendar</li>
                  <li>Click the "+" next to "Other calendars"</li>
                  <li>Select "From URL"</li>
                  <li>Paste your feed URL</li>
                  <li>Click "Add calendar"</li>
                </ol>
                <p className="text-xs text-amber-400 mt-2">⏱️ Google Calendar syncs every 12-24 hours automatically</p>
              </div>
              <div>
                <h5 className="font-medium mb-2">Apple Calendar (iOS/Mac)</h5>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Open Calendar app</li>
                  <li>Go to File → New Calendar Subscription</li>
                  <li>Paste your feed URL</li>
                  <li>Click Subscribe</li>
                </ol>
                <p className="text-xs text-amber-400 mt-2">⏱️ Sync frequency can be set in Calendar → Preferences → Accounts</p>
              </div>
              <div>
                <h5 className="font-medium mb-2">Microsoft Outlook</h5>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Open Outlook Calendar</li>
                  <li>Click "Add calendar" → "Subscribe from web"</li>
                  <li>Paste your feed URL</li>
                  <li>Click Import</li>
                </ol>
                <p className="text-xs text-amber-400 mt-2">⏱️ Outlook web syncs every 3 hours; desktop app varies by settings</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}