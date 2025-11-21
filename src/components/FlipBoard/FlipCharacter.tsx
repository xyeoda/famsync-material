import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface FlipCharacterProps {
  char: string;
  delay?: number;
}

export function FlipCharacter({ char, delay = 0 }: FlipCharacterProps) {
  const [displayChar, setDisplayChar] = useState(char);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (char !== displayChar) {
      const timeout = setTimeout(() => {
        setIsFlipping(true);
        setTimeout(() => {
          setDisplayChar(char);
          setIsFlipping(false);
        }, 200);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [char, displayChar, delay]);

  return (
    <div className="relative">
      <div
        className={cn(
          "w-6 h-8 sm:w-8 sm:h-10 md:w-10 md:h-12",
          "bg-gradient-to-b from-[hsl(var(--surface-container-high))] to-[hsl(var(--surface-container))]",
          "border border-border/30 rounded-sm",
          "flex items-center justify-center",
          "font-mono text-base sm:text-lg md:text-xl font-bold text-foreground",
          "shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.2)]",
          "relative overflow-hidden",
          "transition-opacity duration-200",
          isFlipping && "opacity-50"
        )}
      >
        <span className="relative z-10">{displayChar}</span>
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-border/40 -translate-y-1/2" />
      </div>
    </div>
  );
}
