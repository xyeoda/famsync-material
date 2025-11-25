import { Shield, Users, Baby } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserRoleBadgeProps {
  role: "parent" | "helper" | "kid" | null;
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  if (!role) return null;

  const roleConfig = {
    parent: {
      label: "Parent",
      icon: Shield,
      className: "bg-primary/10 text-primary border-primary/20",
    },
    helper: {
      label: "Helper",
      icon: Users,
      className: "bg-secondary/10 text-secondary-foreground border-secondary/20",
    },
    kid: {
      label: "Kid",
      icon: Baby,
      className: "bg-accent/10 text-accent-foreground border-accent/20",
    },
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
