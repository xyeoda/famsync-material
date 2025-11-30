import { useFamilySettingsContext } from "@/contexts/FamilySettingsContext";

export function TransportationLegend() {
  const { settings, getFamilyMemberName } = useFamilySettingsContext();

  const members = [
    { key: "parent1", color: settings.parent1Color, name: getFamilyMemberName("parent1") },
    { key: "parent2", color: settings.parent2Color, name: getFamilyMemberName("parent2") },
    { key: "housekeeper", color: settings.housekeeperColor, name: getFamilyMemberName("housekeeper") },
  ].filter(member => member.name); // Only show configured members

  if (members.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-surface-container/50 rounded-lg border border-border/40">
      <div className="flex items-center gap-6 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Transportation:</span>
        {members.map(member => (
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
    </div>
  );
}
