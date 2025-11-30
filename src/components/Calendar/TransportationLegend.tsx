import { useFamilySettingsContext } from "@/contexts/FamilySettingsContext";

export function TransportationLegend() {
  const { settings, getFamilyMemberName } = useFamilySettingsContext();

  const kids = [
    { key: "kid1", color: settings.kid1Color, name: getFamilyMemberName("kid1") },
    { key: "kid2", color: settings.kid2Color, name: getFamilyMemberName("kid2") },
  ].filter(member => member.name);

  const transportMembers = [
    { key: "parent1", color: settings.parent1Color, name: getFamilyMemberName("parent1") },
    { key: "parent2", color: settings.parent2Color, name: getFamilyMemberName("parent2") },
    { key: "housekeeper", color: settings.housekeeperColor, name: getFamilyMemberName("housekeeper") },
  ].filter(member => member.name);

  if (kids.length === 0 && transportMembers.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-surface-container/50 rounded-lg border border-border/40 space-y-3">
      {kids.length > 0 && (
        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Kids:</span>
          {kids.map(kid => (
            <div key={kid.key} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: `hsl(${kid.color})` }}
              />
              <span className="text-sm text-foreground">{kid.name}</span>
            </div>
          ))}
        </div>
      )}
      
      {transportMembers.length > 0 && (
        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Transportation:</span>
          {transportMembers.map(member => (
            <div key={member.key} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: `hsl(${member.color})` }}
              />
              <span className="text-sm text-foreground">{member.name}</span>
            </div>
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            (Left = Drop-off | Right = Pick-up)
          </span>
        </div>
      )}
    </div>
  );
}
