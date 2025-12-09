import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Home, Users } from "lucide-react";
import { z } from "zod";

const requestSchema = z.object({
  householdName: z.string().min(2, "Family name must be at least 2 characters").max(100),
  requesterName: z.string().min(2, "Your name must be at least 2 characters").max(100),
  requesterEmail: z.string().email("Please enter a valid email address"),
  message: z.string().max(500, "Message must be less than 500 characters").optional(),
});

export default function RequestAccess() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    householdName: "",
    requesterName: "",
    requesterEmail: "",
    message: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = requestSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('access_requests')
        .insert({
          household_name: formData.householdName,
          requester_name: formData.requesterName,
          requester_email: formData.requesterEmail,
          message: formData.message || null,
        });

      if (error) throw error;

      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting access request:', error);
      toast({
        title: "Error",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold">Request Submitted!</h2>
              <p className="text-muted-foreground">
                Thank you for your interest in KinSync. Our team will review your request 
                and get back to you at <span className="font-medium text-foreground">{formData.requesterEmail}</span> within 1-2 business days.
              </p>
              <div className="pt-4">
                <Button variant="outlined" onClick={() => navigate('/')} className="gap-2">
                  <Home className="h-4 w-4" />
                  Back to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Request Family Access</CardTitle>
          <CardDescription>
            Fill out the form below to request access to KinSync for your family.
            A site administrator will review your request and set up your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="householdName">Family Name</Label>
              <Input
                id="householdName"
                placeholder="e.g., The Smith Family"
                value={formData.householdName}
                onChange={(e) => handleChange("householdName", e.target.value)}
                className={errors.householdName ? "border-destructive" : ""}
              />
              {errors.householdName && (
                <p className="text-sm text-destructive">{errors.householdName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requesterName">Your Name</Label>
              <Input
                id="requesterName"
                placeholder="Your full name"
                value={formData.requesterName}
                onChange={(e) => handleChange("requesterName", e.target.value)}
                className={errors.requesterName ? "border-destructive" : ""}
              />
              {errors.requesterName && (
                <p className="text-sm text-destructive">{errors.requesterName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requesterEmail">Email Address</Label>
              <Input
                id="requesterEmail"
                type="email"
                placeholder="you@example.com"
                value={formData.requesterEmail}
                onChange={(e) => handleChange("requesterEmail", e.target.value)}
                className={errors.requesterEmail ? "border-destructive" : ""}
              />
              {errors.requesterEmail && (
                <p className="text-sm text-destructive">{errors.requesterEmail}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Additional Information (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell us a bit about your family or any specific needs..."
                value={formData.message}
                onChange={(e) => handleChange("message", e.target.value)}
                className={errors.message ? "border-destructive" : ""}
                rows={3}
              />
              {errors.message && (
                <p className="text-sm text-destructive">{errors.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth" className="text-primary hover:underline">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
