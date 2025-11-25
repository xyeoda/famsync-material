import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function AdminBootstrap() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link to="/setup">
        <Button
          variant="elevated"
          size="lg"
          className="gap-2 shadow-lg hover:shadow-xl"
        >
          <Shield className="h-5 w-5" />
          Setup Admin
        </Button>
      </Link>
    </div>
  );
}
