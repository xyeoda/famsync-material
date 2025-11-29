import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home, Mail, RefreshCw } from "lucide-react";

export default function InviteError() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorType, setErrorType] = useState<string>("");

  useEffect(() => {
    const error = searchParams.get("error") || "unknown";
    setErrorType(error);
  }, [searchParams]);

  const errorMessages: Record<string, { title: string; description: string; suggestion: string }> = {
    invalid_invitation: {
      title: "Invalid Invitation Link",
      description: "This invitation link is not valid or may have been revoked.",
      suggestion: "Please contact the person who invited you to send a new invitation.",
    },
    expired_invitation: {
      title: "Invitation Expired",
      description: "This invitation link has expired. Invitation links are valid for 7 days.",
      suggestion: "Please ask the household owner to resend your invitation.",
    },
    invitation_failed: {
      title: "Something Went Wrong",
      description: "We encountered an error while processing your invitation.",
      suggestion: "Please try clicking the invitation link again, or contact support if the problem persists.",
    },
    already_member: {
      title: "Already a Member",
      description: "You're already a member of this household.",
      suggestion: "You can sign in directly to access the family calendar.",
    },
    unknown: {
      title: "Unexpected Error",
      description: "An unexpected error occurred while processing your invitation.",
      suggestion: "Please try again or contact the household owner for a new invitation.",
    },
  };

  const error = errorMessages[errorType] || errorMessages.unknown;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{error.title}</CardTitle>
          <CardDescription className="text-base">{error.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">What you can do:</strong>
              <br />
              {error.suggestion}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/auth")}
              className="w-full"
              size="lg"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Sign In
            </Button>

            {errorType === "invitation_failed" && (
              <Button
                onClick={() => window.location.reload()}
                variant="outlined"
                className="w-full"
                size="lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>

          <div className="pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Need help getting started?
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open("mailto:support@kinsynch.com", "_blank")}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}