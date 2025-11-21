import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface FlipCharacterProps {
  char: string;
  delay?: number;
}

const CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?.,:-'";

export function FlipCharacter({ char, delay = 0 }: FlipCharacterProps) {
  const [displayChar, setDisplayChar] = useState(" ");
  const [isFlipping, setIsFlipping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (char === displayChar) return;

    const timeout = setTimeout(() => {
      // Find positions in charset
      const startIdx = CHARSET.indexOf(displayChar.toUpperCase());
      const endIdx = CHARSET.indexOf(char.toUpperCase());
      
      if (endIdx === -1) {
        setDisplayChar(char);
        return;
      }

      const start = startIdx === -1 ? 0 : startIdx;
      let current = start;
      
      setIsFlipping(true);

      // Cycle through characters
      intervalRef.current = setInterval(() => {
        current = (current + 1) % CHARSET.length;
        setDisplayChar(CHARSET[current]);

        if (current === endIdx) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setIsFlipping(false);
        }
      }, 50); // 50ms per flip for mechanical feel
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [char, displayChar, delay]);

  return (
    <div className="relative perspective-[600px]">
      <div
        className={cn(
          "w-6 h-8 sm:w-8 sm:h-10 md:w-10 md:h-12",
          "bg-gradient-to-b from-[hsl(var(--surface-container-highest))] to-[hsl(var(--surface-container-high))]",
          "border border-border/40 rounded-sm",
          "flex items-center justify-center",
          "font-mono text-base sm:text-lg md:text-xl font-bold text-foreground",
          "shadow-[inset_0_2px_4px_rgba(0,0,0,0.15),0_3px_6px_rgba(0,0,0,0.25)]",
          "relative overflow-hidden",
          "transform-style-3d",
          isFlipping && "animate-[flip_0.1s_ease-in-out]"
        )}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Top half */}
        <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden bg-gradient-to-b from-[hsl(var(--surface-container-highest))] to-[hsl(var(--surface-container-high))]">
          <div className="absolute inset-0 flex items-end justify-center pb-0.5">
            <span className="leading-none">{displayChar}</span>
          </div>
        </div>

        {/* Bottom half */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden bg-gradient-to-b from-[hsl(var(--surface-container-high))] to-[hsl(var(--surface-container))]">
          <div className="absolute inset-0 flex items-start justify-center pt-0.5">
            <span className="leading-none">{displayChar}</span>
          </div>
        </div>

        {/* Center divider line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-border/60 z-10 -translate-y-1/2 shadow-sm" />
        
        {/* Highlight effect on top */}
        <div className="absolute top-0 left-0 right-0 h-[30%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      </div>

      <style>{`
        @keyframes flip {
          0%, 100% {
            transform: rotateX(0deg);
          }
          50% {
            transform: rotateX(5deg);
          }
        }
        
        .perspective-\\[600px\\] {
          perspective: 600px;
        }
      `}</style>
    </div>
  );
}
