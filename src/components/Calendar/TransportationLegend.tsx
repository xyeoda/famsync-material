import { useFamilyMembersContext } from "@/contexts/FamilyMembersContext";

export function TransportationLegend() {
  const { getKids, getAdults } = useFamilyMembersContext();

  const kids = getKids();
  const adults = getAdults();
  
  const hasKids = kids.length > 0;
  const hasTransport = adults.length > 0;

  if (!hasKids && !hasTransport) return null;

  return (
    <div className="mt-4 space-y-3">
      {hasKids && (
        <div className="p-4 bg-surface-container/50 rounded-lg border border-border/40">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Kids:</span>
            <div className="flex items-center gap-4 flex-1 flex-wrap">
              {kids.map((kid) => (
                <div key={kid.id} className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${kid.color})` }}
                  />
                  <span className="text-sm text-foreground">{kid.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {hasTransport && (
        <div className="p-4 bg-surface-container/50 rounded-lg border border-border/40">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Transportation:</span>
            <div className="flex items-center gap-4 flex-1 flex-wrap">
              {adults.map((adult) => (
                <div key={adult.id} className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${adult.color})` }}
                  />
                  <span className="text-sm text-foreground">{adult.name}</span>
                </div>
              ))}
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
