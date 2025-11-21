import { FlipCharacter } from "./FlipCharacter";
import { useFlipBoard } from "@/hooks/useFlipBoard";

interface FlipBoardProps {
  maxChars?: number;
  className?: string;
}

export function FlipBoard({ maxChars = 40, className = "" }: FlipBoardProps) {
  const { currentMessage } = useFlipBoard();

  // Pad or truncate message to fit the board
  const displayMessage = currentMessage.padEnd(maxChars, " ").slice(0, maxChars);

  return (
    <div className={`flip-board ${className}`}>
      <div className="flex flex-wrap gap-0.5 sm:gap-1 p-2 sm:p-3 bg-surface-container-low rounded-lg border border-border/50 shadow-lg">
        {Array.from(displayMessage).map((char, index) => (
          <FlipCharacter 
            key={index} 
            char={char} 
            delay={index * 30}
          />
        ))}
      </div>
    </div>
  );
}
