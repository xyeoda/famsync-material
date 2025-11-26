import { useState, useEffect } from "react";
import { X, Calendar, Users, Settings as SettingsIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const ONBOARDING_STORAGE_KEY = "yeoda-onboarding-completed";

interface OnboardingTourProps {
  userId: string;
}

export function OnboardingTour({ userId }: OnboardingTourProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has completed onboarding
    const storageKey = `${ONBOARDING_STORAGE_KEY}-${userId}`;
    const completed = localStorage.getItem(storageKey);
    
    if (!completed) {
      // Show onboarding after a brief delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  const handleDismiss = (markComplete: boolean = true) => {
    if (markComplete) {
      const storageKey = `${ONBOARDING_STORAGE_KEY}-${userId}`;
      localStorage.setItem(storageKey, "true");
    }
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handleAction = (action: string) => {
    if (action === "calendar") {
      navigate("/calendar");
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    } else if (action === "settings") {
      handleDismiss(true);
      navigate("/settings");
    }
  };

  const steps = [
    {
      icon: Calendar,
      title: "Welcome to YeoDa Family Calendar! 🎉",
      description: "Let's get you started with a quick tour of the main features. You can skip this at any time.",
      action: null,
    },
    {
      icon: Calendar,
      title: "Create Your First Event",
      description: "Head to the Calendar view to create recurring events for your family's activities, sports, and appointments.",
      action: "calendar",
      actionLabel: "Go to Calendar",
    },
    {
      icon: Users,
      title: "Invite Family Members",
      description: "Use the 'Manage Users' button to invite other family members. They'll receive an email invitation to join your household.",
      action: null,
    },
    {
      icon: SettingsIcon,
      title: "Customize Your Setup",
      description: "Visit Settings to update your household name and customize family member names and colors to match your family.",
      action: "settings",
      actionLabel: "Open Settings",
    },
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-card border-border shadow-lg">
        <CardHeader className="relative">
          <Button
            variant="text"
            size="icon"
            onClick={() => handleDismiss()}
            className="absolute top-2 right-2 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>{currentStepData.title}</CardTitle>
              <CardDescription className="mt-1">
                Step {currentStep + 1} of {steps.length}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentStepData.description}
          </p>

          <div className="flex items-center gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-primary"
                    : index < currentStep
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outlined"
              onClick={() => handleDismiss()}
              className="flex-1"
            >
              Skip Tour
            </Button>
            {currentStepData.action ? (
              <Button
                onClick={() => handleAction(currentStepData.action!)}
                className="flex-1 gap-2"
              >
                {currentStepData.actionLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="flex-1 gap-2"
              >
                {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
