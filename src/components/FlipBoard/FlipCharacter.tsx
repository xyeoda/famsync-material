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
        }, 150);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [char, displayChar, delay]);

  return (
    <div className="flip-character-container relative">
      <div
        className={cn(
          "flip-character",
          "relative w-6 h-8 sm:w-8 sm:h-10 md:w-10 md:h-12",
          "bg-gradient-to-b from-[hsl(var(--surface-container-high))] to-[hsl(var(--surface-container))]",
          "border border-border/30 rounded-sm",
          "flex items-center justify-center",
          "font-mono text-base sm:text-lg md:text-xl font-bold text-foreground",
          "shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.2)]",
          "overflow-hidden",
          isFlipping && "flipping"
        )}
      >
        <div className="flip-char-top absolute top-0 left-0 right-0 h-1/2 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-full flex items-center justify-center transform translate-y-1/4">
            {displayChar}
          </div>
        </div>
        <div className="flip-char-bottom absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-full flex items-center justify-center transform -translate-y-1/4">
            {displayChar}
          </div>
        </div>
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-border/50" />
      </div>

      <style>{`
        .flipping .flip-char-top {
          animation: flipTop 150ms ease-in forwards;
        }
        
        .flipping .flip-char-bottom {
          animation: flipBottom 150ms ease-out 150ms forwards;
        }

        @keyframes flipTop {
          0% {
            transform: rotateX(0deg);
            transform-origin: bottom;
          }
          100% {
            transform: rotateX(-90deg);
            transform-origin: bottom;
          }
        }

        @keyframes flipBottom {
          0% {
            transform: rotateX(90deg);
            transform-origin: top;
          }
          100% {
            transform: rotateX(0deg);
            transform-origin: top;
          }
        }
      `}</style>
    </div>
  );
}
