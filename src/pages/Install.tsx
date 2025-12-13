import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Share, MoreVertical, Plus, Download, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
              Install KinSync
            </h1>
            <p className="text-muted-foreground">Get the full app experience on your device</p>
          </div>
        </div>

        {/* Already Installed */}
        {isInstalled && (
          <Card className="border-green-500/50 bg-green-500/10">
            <CardContent className="flex items-center gap-4 py-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <div>
                <h3 className="font-semibold text-green-500">App Already Installed!</h3>
                <p className="text-sm text-muted-foreground">
                  KinSync is installed on your device. Look for it on your home screen.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Install Button (Chrome/Edge/Samsung) */}
        {deferredPrompt && !isInstalled && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex flex-col items-center text-center gap-4">
                <Download className="h-12 w-12 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">Quick Install Available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Install KinSync directly to your home screen with one tap.
                  </p>
                </div>
                <Button onClick={handleInstallClick} size="lg" className="gap-2">
                  <Download className="h-5 w-5" />
                  Install KinSync
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* iOS Instructions */}
        <Card className={isIOS ? "ring-2 ring-primary" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">iPhone & iPad</CardTitle>
                <CardDescription>Install using Safari browser</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                <div>
                  <p className="font-medium">Open in Safari</p>
                  <p className="text-sm text-muted-foreground">
                    Make sure you're viewing this page in Safari (not Chrome or other browsers)
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <div className="flex items-start gap-2">
                  <div>
                    <p className="font-medium">Tap the Share button</p>
                    <p className="text-sm text-muted-foreground">
                      Located at the bottom of Safari (or top on iPad)
                    </p>
                  </div>
                  <Share className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <div className="flex items-start gap-2">
                  <div>
                    <p className="font-medium">Tap "Add to Home Screen"</p>
                    <p className="text-sm text-muted-foreground">
                      Scroll down in the share menu to find this option
                    </p>
                  </div>
                  <Plus className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
                  4
                </span>
                <div>
                  <p className="font-medium">Tap "Add"</p>
                  <p className="text-sm text-muted-foreground">
                    KinSync will appear on your home screen as an app
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Android Instructions */}
        <Card className={isAndroid && !deferredPrompt ? "ring-2 ring-primary" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Smartphone className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Android</CardTitle>
                <CardDescription>Install using Chrome or Samsung Internet</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                <div className="flex items-start gap-2">
                  <div>
                    <p className="font-medium">Tap the menu button</p>
                    <p className="text-sm text-muted-foreground">
                      Three dots in the top-right corner of Chrome
                    </p>
                  </div>
                  <MoreVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <div>
                  <p className="font-medium">Tap "Add to Home Screen" or "Install App"</p>
                  <p className="text-sm text-muted-foreground">
                    The exact wording may vary by browser version
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <div>
                  <p className="font-medium">Confirm the installation</p>
                  <p className="text-sm text-muted-foreground">
                    KinSync will be added to your home screen and app drawer
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Why Install?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">Access KinSync instantly from your home screen</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">Works offline - view your calendar without internet</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">Full-screen experience without browser controls</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">Faster loading times after installation</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Back to app link */}
        <div className="text-center pt-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to KinSync
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Install;
