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
    <div className="mt-4 p-4 bg-surface-container/50 rounded-lg border border-border/40 space-y-4">
      {hasKids && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Kids:</span>
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-6 rounded overflow-hidden border border-border/40 min-w-[120px]">
              {kid1Name && (
                <div 
                  className="flex-1"
                  style={{ backgroundColor: `hsl(${settings.kid1Color})` }}
                />
              )}
              {kid2Name && (
                <div 
                  className="flex-1"
                  style={{ backgroundColor: `hsl(${settings.kid2Color})` }}
                />
              )}
            </div>
            <div className="flex gap-4 text-sm text-foreground">
              {kid1Name && <span>{kid1Name}</span>}
              {kid2Name && <span>{kid2Name}</span>}
            </div>
          </div>
        </div>
      )}
      
      {hasTransport && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Transportation:</span>
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-6 rounded overflow-hidden border border-border/40 min-w-[120px]">
              <div 
                className="flex-1"
                style={{ backgroundColor: parent1Name ? `hsl(${settings.parent1Color})` : (parent2Name ? `hsl(${settings.parent2Color})` : `hsl(${settings.housekeeperColor})`) }}
              />
              <div 
                className="flex-1"
                style={{ backgroundColor: parent2Name ? `hsl(${settings.parent2Color})` : (housekeeperName ? `hsl(${settings.housekeeperColor})` : `hsl(${settings.parent1Color})`) }}
              />
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-foreground">
                {parent1Name || parent2Name || housekeeperName}
              </span>
              {((parent1Name && parent2Name) || (parent1Name && housekeeperName) || (parent2Name && housekeeperName)) && (
                <span className="text-foreground">
                  {parent2Name || housekeeperName}
                </span>
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
