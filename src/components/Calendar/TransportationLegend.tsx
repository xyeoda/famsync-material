import { useFamilySettingsContext } from "@/contexts/FamilySettingsContext";

export function TransportationLegend() {
  const { settings, getFamilyMemberName } = useFamilySettingsContext();

  const kid1Name = getFamilyMemberName("kid1");
  const kid2Name = getFamilyMemberName("kid2");
  const hasKids = kid1Name || kid2Name;

  const parent1Name = getFamilyMemberName("parent1");
  const parent2Name = getFamilyMemberName("parent2");
  const housekeeperName = getFamilyMemberName("housekeeper");
  const hasTransport = parent1Name || parent2Name || housekeeperName;

  if (!hasKids && !hasTransport) return null;

  return (
    <div className="mt-4 space-y-3">
      {hasKids && (
        <div className="p-4 bg-surface-container/50 rounded-lg border border-border/40">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Kids:</span>
            <div className="flex items-center gap-4 flex-1">
              {kid1Name && (
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${settings.kid1Color})` }}
                  />
                  <span className="text-sm text-foreground">{kid1Name}</span>
                </div>
              )}
              {kid2Name && (
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${settings.kid2Color})` }}
                  />
                  <span className="text-sm text-foreground">{kid2Name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {hasTransport && (
        <div className="p-4 bg-surface-container/50 rounded-lg border border-border/40">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Transportation:</span>
            <div className="flex items-center gap-4 flex-1 flex-wrap">
              {parent1Name && (
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${settings.parent1Color})` }}
                  />
                  <span className="text-sm text-foreground">{parent1Name}</span>
                </div>
              )}
              {parent2Name && (
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${settings.parent2Color})` }}
                  />
                  <span className="text-sm text-foreground">{parent2Name}</span>
                </div>
              )}
              {housekeeperName && (
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${settings.housekeeperColor})` }}
                  />
                  <span className="text-sm text-foreground">{housekeeperName}</span>
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                (Left: Drop-off | Right: Pick-up)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
